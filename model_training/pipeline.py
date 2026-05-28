"""Prediction pipeline, decomposed into reusable stages.

The historical ``predict_stock_price`` function in this package mixed
data fetching, preprocessing, scaling, model construction, training,
evaluation, plotting, and report writing in one place. That made it
hard to test, hard to reuse, and hard to evolve toward async jobs or
model caching.

This module exposes the same behavior split into eight stages:

    load_data          -> raw OHLC data for a single symbol
    preprocess_data    -> cleaned 1-D close-price series
    create_sequences   -> sliding-window train/test arrays
    build_model        -> a fresh Keras LSTM
    train_model        -> fits the model and returns history
    evaluate_model     -> RMSE / MAE / R^2 / directional accuracy
    generate_forecast  -> per-row prediction frame for the test window
    persist_outputs    -> PNG plot, TXT report, and JSON run artifact

``predict_stock_price`` (in ``model_training_and_prediction``) becomes a
thin wrapper that orchestrates these stages, preserving the existing
public signature and on-disk outputs.
"""

from __future__ import annotations

import math
import time
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd

from core.artifacts import build_artifact, write_artifact
from core.config import ModelConfig, get_app_config, get_model_config
from core.logging_setup import get_logger, log_context, timed
from utils.trend_signals import calculate_trend_signals

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Stage outputs
# ---------------------------------------------------------------------------


@dataclass
class PreparedData:
    """Cleaned univariate close-price series and supporting metadata."""

    frame: pd.DataFrame  # single-column DataFrame indexed by date with column "Close"
    price_column: str
    history_days: int
    timings: dict[str, float] = field(default_factory=dict)


@dataclass
class SequenceTensors:
    """Sliding-window arrays plus the scaler and split index."""

    x_train: np.ndarray
    y_train: np.ndarray
    x_test: np.ndarray
    y_test: np.ndarray
    scaler: Any
    training_data_len: int
    sequence_length: int


@dataclass
class TrainingResult:
    """Outcome of fitting the LSTM."""

    model: Any
    history: Any
    final_loss: float
    epochs_run: int


@dataclass
class EvaluationResult:
    """Backtest metrics on the held-out tail."""

    metrics: dict[str, float]
    predictions: np.ndarray  # shape (n, 1) in original price units


@dataclass
class ForecastFrame:
    """The DataFrame the API surfaces and reports consume."""

    frame: pd.DataFrame  # columns: Close, Predictions; indexed by date
    tail: int


# ---------------------------------------------------------------------------
# Stage 1: load
# ---------------------------------------------------------------------------


def load_data(symbol: str, *, config: ModelConfig | None = None) -> pd.DataFrame:
    """Fetch raw OHLC data for ``symbol`` from yfinance.

    Kept deliberately simple: returns the unmodified yfinance frame so
    callers can inspect the original columns. Raises ``ValueError`` when
    no data is available, matching the legacy contract.
    """
    config = config or get_model_config()
    # Local import keeps yfinance optional during unit tests.
    import yfinance as yf

    end = datetime.now()
    start = end - timedelta(days=config.history_days)

    logger.info(
        "load_data_start",
        extra={"extra_fields": {"symbol": symbol, "start": str(start.date()), "end": str(end.date())}},
    )
    df = yf.download(symbol, start=start, end=end, progress=False)
    if df is None or df.empty:
        raise ValueError(f"No data available for {symbol}")
    logger.info(
        "load_data_complete",
        extra={"extra_fields": {"symbol": symbol, "rows": len(df), "columns": list(df.columns)}},
    )
    return df


# ---------------------------------------------------------------------------
# Stage 2: preprocess
# ---------------------------------------------------------------------------


def preprocess_data(
    df: pd.DataFrame,
    symbol: str,
    *,
    config: ModelConfig | None = None,
) -> PreparedData:
    """Pick a price column, fill NaNs, and return a clean univariate frame."""
    config = config or get_model_config()

    if df is None or df.empty:
        raise ValueError(f"No data available for {symbol}")

    if "Adj Close" in df.columns:
        price_column = "Adj Close"
    elif "Close" in df.columns:
        price_column = "Close"
    else:
        raise ValueError(f"No price data (Close or Adj Close) available for {symbol}")

    series = df[price_column]
    # Multi-ticker results can arrive as a single-column DataFrame; flatten.
    if isinstance(series, pd.DataFrame):
        series = series.iloc[:, 0]

    data = series.to_frame(name="Close")

    # Forward fill, then back fill. Use the modern pandas API to avoid the
    # FutureWarning emitted by ``fillna(method=...)``.
    if data["Close"].isna().any():
        missing = int(data["Close"].isna().sum())
        logger.warning(
            "preprocess_filling_nan",
            extra={"extra_fields": {"symbol": symbol, "missing": missing}},
        )
        data["Close"] = data["Close"].ffill().bfill()

    if data["Close"].isna().any():
        raise ValueError(f"Unable to fill missing values for {symbol}")

    if len(data) < config.sequence_length:
        raise ValueError(
            f"Insufficient historical data for {symbol}. "
            f"Need at least {config.sequence_length} days, got {len(data)}."
        )

    return PreparedData(
        frame=data,
        price_column=price_column,
        history_days=config.history_days,
    )


# ---------------------------------------------------------------------------
# Stage 3: sliding-window sequences
# ---------------------------------------------------------------------------


def create_sequences(
    prepared: PreparedData,
    *,
    config: ModelConfig | None = None,
) -> SequenceTensors:
    """Build (x_train, y_train) and (x_test, y_test) tensors with MinMax scaling.

    Mirrors the historical behavior exactly to keep reported metrics
    backwards-compatible: scaler is fit on the full series before the
    split. (This is a known caveat we plan to address in Phase 1; it is
    explicitly preserved here.)
    """
    from sklearn.preprocessing import MinMaxScaler

    config = config or get_model_config()
    sequence_length = config.sequence_length

    dataset = prepared.frame["Close"].to_numpy().reshape(-1, 1)
    training_data_len = int(np.ceil(len(dataset) * config.train_split))

    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled_data = scaler.fit_transform(dataset)

    train_data = scaled_data[:training_data_len, :]
    x_train: list[np.ndarray] = []
    y_train: list[float] = []
    for i in range(sequence_length, len(train_data)):
        x_train.append(train_data[i - sequence_length : i, 0])
        y_train.append(train_data[i, 0])

    x_train_arr = np.array(x_train)
    y_train_arr = np.array(y_train)
    x_train_arr = np.reshape(x_train_arr, (x_train_arr.shape[0], x_train_arr.shape[1], 1))

    test_data = scaled_data[training_data_len - sequence_length :, :]
    x_test: list[np.ndarray] = []
    y_test = dataset[training_data_len:, :]
    for i in range(sequence_length, len(test_data)):
        x_test.append(test_data[i - sequence_length : i, 0])

    x_test_arr = np.array(x_test)
    x_test_arr = np.reshape(x_test_arr, (x_test_arr.shape[0], x_test_arr.shape[1], 1))

    return SequenceTensors(
        x_train=x_train_arr,
        y_train=y_train_arr,
        x_test=x_test_arr,
        y_test=y_test,
        scaler=scaler,
        training_data_len=training_data_len,
        sequence_length=sequence_length,
    )


# ---------------------------------------------------------------------------
# Stage 4: model construction
# ---------------------------------------------------------------------------


def build_model(input_shape: tuple[int, int], *, config: ModelConfig | None = None):
    """Construct an uncompiled Keras Sequential LSTM matching the legacy spec."""
    from keras.layers import LSTM, Dense, Dropout
    from keras.models import Sequential

    config = config or get_model_config()
    model = Sequential()
    model.add(LSTM(config.lstm_units_1, return_sequences=True, input_shape=input_shape))
    model.add(Dropout(config.dropout))
    model.add(LSTM(config.lstm_units_2, return_sequences=False))
    model.add(Dropout(config.dropout))
    model.add(Dense(config.dense_units, activation="relu"))
    model.add(Dense(1))
    return model


# ---------------------------------------------------------------------------
# Stage 5: training
# ---------------------------------------------------------------------------


class _ProgressCallback:
    """Lightweight Keras callback that emits structured progress logs."""

    def __init__(self, *, interval: int, symbol: str):
        from keras.callbacks import Callback  # local import keeps tests light

        self._interval = max(1, interval)
        self._symbol = symbol
        self._epoch_logger = logger

        # Build a dynamic subclass so we can reuse the supplied Keras Callback
        # without forcing a top-level import.
        outer = self

        class _Inner(Callback):  # type: ignore[misc]
            def on_epoch_end(self_inner, epoch, logs=None):  # noqa: D401, N805
                logs = logs or {}
                if (epoch + 1) % outer._interval == 0:
                    outer._epoch_logger.info(
                        "training_epoch",
                        extra={
                            "extra_fields": {
                                "symbol": outer._symbol,
                                "epoch": epoch + 1,
                                "loss": float(logs.get("loss", float("nan"))),
                            }
                        },
                    )

        self._inner = _Inner()

    @property
    def callback(self):
        return self._inner


def train_model(
    model,
    sequences: SequenceTensors,
    *,
    symbol: str,
    config: ModelConfig | None = None,
) -> TrainingResult:
    """Compile and fit the LSTM, returning the trained model and history."""
    from keras.callbacks import EarlyStopping
    from keras.optimizers import Adam

    config = config or get_model_config()

    optimizer: Any = config.optimizer
    if config.optimizer == "adam" and config.learning_rate is not None:
        optimizer = Adam(learning_rate=config.learning_rate)

    model.compile(optimizer=optimizer, loss=config.loss)

    early_stopping = EarlyStopping(
        monitor=config.early_stopping_monitor,
        patience=config.early_stopping_patience,
        restore_best_weights=True,
    )

    progress_cb = _ProgressCallback(interval=config.progress_log_interval, symbol=symbol).callback

    with timed(logger, "training_run", symbol=symbol):
        history = model.fit(
            sequences.x_train,
            sequences.y_train,
            batch_size=config.batch_size,
            epochs=config.epochs,
            callbacks=[progress_cb, early_stopping],
            verbose=0,
        )

    losses = history.history.get("loss", [])
    final_loss = float(losses[-1]) if losses else float("nan")
    return TrainingResult(
        model=model,
        history=history,
        final_loss=final_loss,
        epochs_run=len(losses),
    )


# ---------------------------------------------------------------------------
# Stage 6: evaluation
# ---------------------------------------------------------------------------


def _calculate_directional_accuracy(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Percentage of consecutive moves where actual and predicted directions agree."""
    try:
        true_dir = np.diff(y_true.flatten())
        pred_dir = np.diff(y_pred.flatten())
        if true_dir.size == 0:
            return 0.0
        correct = np.sum((true_dir * pred_dir) > 0)
        return float(correct / true_dir.size * 100.0)
    except Exception as exc:  # pragma: no cover - defensive
        logger.warning(
            "directional_accuracy_failed",
            extra={"extra_fields": {"error": str(exc)}},
        )
        return 0.0


def evaluate_model(
    training: TrainingResult,
    sequences: SequenceTensors,
) -> EvaluationResult:
    """Score the model on the held-out tail and return original-scale metrics."""
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    raw_predictions = training.model.predict(sequences.x_test, verbose=0)
    predictions = sequences.scaler.inverse_transform(raw_predictions)

    y_test = sequences.y_test
    rmse = math.sqrt(mean_squared_error(y_test, predictions))
    mae = float(mean_absolute_error(y_test, predictions))
    r2 = float(r2_score(y_test, predictions))
    directional_accuracy = _calculate_directional_accuracy(y_test, predictions)

    mean_actual = float(np.mean(y_test)) if y_test.size else float("nan")
    normalized_rmse = (rmse / mean_actual * 100.0) if mean_actual else float("nan")

    metrics = {
        "rmse": float(rmse),
        "normalized_rmse": float(normalized_rmse),
        "mae": mae,
        "r2": r2,
        "directional_accuracy": directional_accuracy,
        "final_loss": float(training.final_loss),
    }
    return EvaluationResult(metrics=metrics, predictions=predictions)


# ---------------------------------------------------------------------------
# Stage 7: forecast frame
# ---------------------------------------------------------------------------


def generate_forecast(
    prepared: PreparedData,
    sequences: SequenceTensors,
    evaluation: EvaluationResult,
) -> ForecastFrame:
    """Return a DataFrame aligned to the test window with Close + Predictions."""
    valid = prepared.frame.iloc[sequences.training_data_len :].copy()
    if len(evaluation.predictions) != len(valid):
        # Defensive: align lengths if a mismatch ever appears.
        n = min(len(evaluation.predictions), len(valid))
        valid = valid.iloc[-n:].copy()
        preds = evaluation.predictions[-n:]
    else:
        preds = evaluation.predictions

    valid["Predictions"] = preds
    return ForecastFrame(frame=valid, tail=valid.shape[0])


# ---------------------------------------------------------------------------
# Stage 8: persistence (PNG + TXT + JSON)
# ---------------------------------------------------------------------------


def _save_prediction_plot(prepared: PreparedData, predictions: np.ndarray, symbol: str) -> Path | None:
    """Render the actual-vs-predicted plot to ``results/{symbol}_prediction_plot.png``."""
    import matplotlib

    matplotlib.use("Agg")  # safe to call repeatedly
    import matplotlib.pyplot as plt

    try:
        results_dir = get_app_config().results_dir
        results_dir.mkdir(parents=True, exist_ok=True)

        plt.figure(figsize=(12, 6))
        n = len(predictions)
        index = prepared.frame.index[-n:]
        actual = prepared.frame["Close"].iloc[-n:]
        plt.plot(index, actual, label="Actual")
        plt.plot(index, predictions, label="Predicted")
        plt.title(f"{symbol} Stock Price Prediction")
        plt.xlabel("Date")
        plt.ylabel("Price")
        plt.legend()

        path = results_dir / f"{symbol}_prediction_plot.png"
        plt.savefig(path)
        plt.close()
        return path
    except Exception as exc:
        logger.warning(
            "save_prediction_plot_failed",
            extra={"extra_fields": {"symbol": symbol, "error": str(exc)}},
        )
        try:
            plt.close()
        except Exception:
            pass
        return None


def _save_prediction_report(
    metrics: dict[str, float],
    symbol: str,
    forecast: ForecastFrame,
    *,
    config: ModelConfig,
) -> Path | None:
    """Write the legacy plain-text report to ``results/{symbol}_prediction_report.txt``."""
    try:
        results_dir = get_app_config().results_dir
        results_dir.mkdir(parents=True, exist_ok=True)
        report_path = results_dir / f"{symbol}_prediction_report.txt"

        last_n = forecast.frame.tail(config.report_tail)

        lines: list[str] = []
        lines.append(f"Prediction Report for {symbol}")
        lines.append("=" * 50)
        lines.append("")
        lines.append("Model Architecture:")
        lines.append("-" * 20)
        lines.append(f"- Input Layer: LSTM ({config.lstm_units_1} units) with Dropout ({config.dropout})")
        lines.append(f"- Hidden Layer: LSTM ({config.lstm_units_2} units) with Dropout ({config.dropout})")
        lines.append(f"- Dense Layer: {config.dense_units} units (ReLU activation)")
        lines.append("- Output Layer: 1 unit")
        lines.append("")
        lines.append("Model Performance Metrics:")
        lines.append("-" * 25)
        lines.append(f'Root Mean Square Error (RMSE): {metrics["rmse"]:.2f}')
        lines.append(f'Normalized RMSE: {metrics["normalized_rmse"]:.2f}%')
        lines.append(f'Mean Absolute Error (MAE): {metrics["mae"]:.2f}')
        lines.append(f'R-squared Score: {metrics["r2"]:.4f}')
        lines.append(f'Directional Accuracy: {metrics["directional_accuracy"]:.2f}%')
        lines.append(f'Final Training Loss: {metrics["final_loss"]:.6f}')
        lines.append("")
        lines.append(f"Last {config.report_tail} Days Prediction vs Actual Values:")
        lines.append("-" * 40)
        lines.append(f'{"Date":<12}{"Actual Price":>15}{"Predicted Price":>18}')
        lines.append("-" * 45)
        for date, row in last_n.iterrows():
            try:
                date_str = date.strftime("%Y-%m-%d")
            except AttributeError:
                date_str = str(date)
            lines.append(
                f'{date_str:<12}${float(row["Close"]):>14.2f}${float(row["Predictions"]):>17.2f}'
            )

        report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return report_path
    except Exception as exc:
        logger.warning(
            "save_prediction_report_failed",
            extra={"extra_fields": {"symbol": symbol, "error": str(exc)}},
        )
        return None


def _forecast_rows(forecast: ForecastFrame, *, tail: int) -> list[dict[str, Any]]:
    """Convert the tail of the forecast frame into JSON-serializable rows."""
    last_n = forecast.frame.tail(tail)
    rows: list[dict[str, Any]] = []
    for date, row in last_n.iterrows():
        try:
            date_str = date.isoformat() if hasattr(date, "isoformat") else str(date)
        except Exception:
            date_str = str(date)
        rows.append(
            {
                "date": date_str,
                "actual": float(row["Close"]),
                "predicted": float(row["Predictions"]),
            }
        )
    return rows


def persist_outputs(
    *,
    symbol: str,
    prepared: PreparedData,
    forecast: ForecastFrame,
    evaluation: EvaluationResult,
    config: ModelConfig,
    technical_indicators: dict[str, str] | None = None,
    timings: dict[str, float] | None = None,
    raw_data: pd.DataFrame | None = None,
) -> dict[str, Any]:
    """Write PNG, TXT, and JSON artifacts. Returns paths and the artifact dict.

    Existing PNG and TXT outputs are preserved exactly so the current
    download endpoint and any human-readable workflows keep working.
    The JSON artifact is additive.
    """
    plot_path = _save_prediction_plot(prepared, evaluation.predictions, symbol)
    report_path = _save_prediction_report(
        evaluation.metrics, symbol, forecast, config=config
    )

    indicators = technical_indicators
    if indicators is None:
        indicators = calculate_trend_signals(forecast.frame, raw_data)

    artifact = build_artifact(
        symbol=symbol,
        metrics=evaluation.metrics,
        predictions=_forecast_rows(forecast, tail=config.report_tail),
        model_config=config,
        technical_indicators=indicators,
        inputs={
            "history_days": prepared.history_days,
            "rows_used": int(len(prepared.frame)),
            "price_column": prepared.price_column,
        },
        timings=dict(timings or {}),
    )
    artifact_path = write_artifact(artifact)

    return {
        "plot_path": str(plot_path) if plot_path else None,
        "report_path": str(report_path) if report_path else None,
        "artifact_path": str(artifact_path),
        "artifact": artifact.to_dict(),
        "technical_indicators": indicators,
    }


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def run_pipeline(
    symbol: str,
    *,
    config: ModelConfig | None = None,
    raw_data: pd.DataFrame | None = None,
) -> tuple[pd.DataFrame, dict[str, float], dict[str, Any]]:
    """Execute the full pipeline and return ``(forecast_df, metrics, extra)``.

    ``raw_data`` may be supplied to skip the network round-trip when the
    caller has already fetched the OHLC frame (e.g. the API path that
    fetches data once for technical analysis).
    """
    config = config or get_model_config()
    timings: dict[str, float] = {}

    with log_context(symbol=symbol):
        with timed(logger, "pipeline_run", symbol=symbol) as outer_payload:
            t0 = time.perf_counter()
            df = raw_data if raw_data is not None else load_data(symbol, config=config)
            timings["load_data_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            prepared = preprocess_data(df, symbol, config=config)
            timings["preprocess_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            sequences = create_sequences(prepared, config=config)
            timings["sequences_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            model = build_model((sequences.x_train.shape[1], 1), config=config)
            timings["build_model_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            training = train_model(model, sequences, symbol=symbol, config=config)
            timings["train_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            evaluation = evaluate_model(training, sequences)
            timings["evaluate_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            forecast = generate_forecast(prepared, sequences, evaluation)
            timings["forecast_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)

            t0 = time.perf_counter()
            persisted = persist_outputs(
                symbol=symbol,
                prepared=prepared,
                forecast=forecast,
                evaluation=evaluation,
                config=config,
                timings=timings,
                raw_data=df,
            )
            timings["persist_ms"] = round((time.perf_counter() - t0) * 1000.0, 2)
            outer_payload["timings"] = timings

    extra = {
        "timings": timings,
        "training": {
            "epochs_run": training.epochs_run,
            "final_loss": training.final_loss,
        },
        **persisted,
    }
    return forecast.frame, evaluation.metrics, extra
