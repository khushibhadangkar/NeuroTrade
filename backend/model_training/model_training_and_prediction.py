"""Backwards-compatible facade for the prediction pipeline.

Historically this module contained one large ``predict_stock_price``
function plus several private helpers. The implementation now lives in
``model_training.pipeline`` (split into eight discrete stages). This
module preserves the public API so existing callers - the Flask app,
the CLI script, and any external imports - continue to work unchanged.

Re-exports
----------
predict_stock_price
    Train and evaluate the LSTM for a given symbol.
calculate_directional_accuracy
    Pure helper retained for backwards compatibility.
save_prediction_plot, save_prediction_report
    Legacy output writers retained for backwards compatibility.
generate_report
    Restored function used by ``scripts/main.py``. Writes the per-symbol
    text report and PNG using the existing pipeline outputs.
generate_final_report
    Restored function used by ``scripts/main.py``. Produces the
    aggregate ``results/final_model_report.txt`` summary.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Iterable, Mapping

import numpy as np
import pandas as pd

from core.config import get_app_config, get_model_config
from core.logging_setup import get_logger
from model_training.pipeline import (
    PreparedData,
    _save_prediction_plot,
    _save_prediction_report,
    create_sequences,
    build_model,
    evaluate_model,
    generate_forecast,
    load_data,
    preprocess_data,
    run_pipeline,
    train_model,
)
from model_training.pipeline import _calculate_directional_accuracy

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Public API preserved for backwards compatibility
# ---------------------------------------------------------------------------


def calculate_directional_accuracy(y_true, y_pred) -> float:
    """Percentage of consecutive moves where directions agree."""
    return _calculate_directional_accuracy(np.asarray(y_true), np.asarray(y_pred))


def save_prediction_plot(data: pd.DataFrame, predictions, symbol: str):
    """Legacy plot writer.

    The historical signature accepted the *full* historical frame plus the
    predictions array. We delegate to the pipeline implementation.
    """
    prepared = PreparedData(
        frame=data[["Close"]] if "Close" in data.columns else data.rename(columns={data.columns[0]: "Close"}),
        price_column="Close",
        history_days=get_model_config().history_days,
    )
    return _save_prediction_plot(prepared, np.asarray(predictions), symbol)


def save_prediction_report(metrics: Mapping[str, Any], symbol: str, data: pd.DataFrame, predictions) -> None:
    """Legacy text report writer used by ``scripts/main.py``."""
    config = get_model_config()
    last_n = data.tail(config.report_tail).copy()
    if "Predictions" not in last_n.columns:
        preds = np.asarray(predictions)[-len(last_n) :]
        last_n["Predictions"] = preds

    from model_training.pipeline import ForecastFrame

    forecast = ForecastFrame(frame=last_n, tail=len(last_n))
    _save_prediction_report(dict(metrics), symbol, forecast, config=config)


def predict_stock_price(symbol: str):
    """Train an LSTM for ``symbol`` and return ``(forecast_df, metrics)``.

    Behavior is preserved end-to-end with the legacy implementation:
    same hyperparameters, same on-disk PNG/TXT outputs, same return
    shape. The only addition is a JSON run artifact written under
    ``results/runs/`` for audit and replay.
    """
    try:
        forecast_df, metrics, _ = run_pipeline(symbol)
        return forecast_df, metrics
    except ValueError:
        # Re-raise data-availability errors with the original wording so
        # callers that match on the exception message continue to work.
        raise
    except Exception as exc:
        logger.exception("predict_stock_price_failed", extra={"extra_fields": {"symbol": symbol}})
        raise ValueError(f"Failed to process {symbol}: {exc}") from exc


# ---------------------------------------------------------------------------
# CLI helpers (restored)
# ---------------------------------------------------------------------------


def generate_report(symbol: str, predictions: pd.DataFrame, metrics: Mapping[str, Any]) -> None:
    """Write the per-symbol PNG plot and TXT report.

    Restored to fix the ``ImportError`` raised by ``scripts/main.py``.
    Accepts the same arguments the script passed historically:

    - ``symbol``: ticker.
    - ``predictions``: DataFrame returned by :func:`predict_stock_price`
      containing ``Close`` and ``Predictions`` columns.
    - ``metrics``: dict returned by :func:`predict_stock_price`.
    """
    if predictions is None or predictions.empty:
        logger.warning("generate_report_skipped", extra={"extra_fields": {"symbol": symbol}})
        return

    config = get_model_config()
    pred_array = predictions["Predictions"].to_numpy().reshape(-1, 1)

    prepared = PreparedData(
        frame=predictions[["Close"]],
        price_column="Close",
        history_days=config.history_days,
    )
    _save_prediction_plot(prepared, pred_array, symbol)

    from model_training.pipeline import ForecastFrame

    forecast = ForecastFrame(frame=predictions, tail=len(predictions))
    _save_prediction_report(dict(metrics), symbol, forecast, config=config)


def generate_final_report(all_metrics: Mapping[str, Mapping[str, Any]]) -> Path:
    """Write the aggregate model report consumed by users.

    Restored to fix the ``ImportError`` raised by ``scripts/main.py``.
    Produces ``results/final_model_report.txt`` with one row per symbol,
    matching the historical format that lives in the repo today.
    """
    config = get_model_config()
    results_dir = get_app_config().results_dir
    results_dir.mkdir(parents=True, exist_ok=True)
    path = results_dir / "final_model_report.txt"

    lines: list[str] = []
    lines.append("### Final Model Performance Report")
    lines.append("")
    lines.append("#### Overview")
    lines.append("This report summarizes the performance metrics for all analyzed stocks.")
    lines.append("")
    lines.append("#### Performance Metrics by Stock")
    lines.append(f'{"Symbol":<10}{"RMSE":>10}{"NRMSE%":>12}{"Dir. Acc%":>12}{"R2":>12}')
    lines.append("-" * 58)

    for symbol, metrics in all_metrics.items():
        if not metrics:
            lines.append(f"{symbol:<10}{'n/a':>10}{'n/a':>12}{'n/a':>12}{'n/a':>12}")
            continue
        rmse = float(metrics.get("rmse", float("nan")))
        nrmse = float(metrics.get("normalized_rmse", float("nan")))
        dir_acc = float(metrics.get("directional_accuracy", float("nan")))
        r2 = float(metrics.get("r2", float("nan")))
        lines.append(
            f"{symbol:<10}{rmse:>10.2f}{nrmse:>12.2f}{dir_acc:>12.2f}{r2:>12.4f}"
        )

    lines.append("")
    lines.append("#### Model Architecture Details")
    lines.append("- Enhanced Sequential Model with LSTM layers and Dropout")
    lines.append(f"- Input features: {config.sequence_length} days of historical data")
    lines.append(f"- Training/Testing split: {int(config.train_split * 100)}/{int((1 - config.train_split) * 100)}")
    lines.append(f"- Optimizer: {config.optimizer.title()} with {config.loss.title()} loss")
    lines.append(f"- Early stopping with patience of {config.early_stopping_patience} epochs")
    lines.append(f"- Dropout layers ({config.dropout}) for regularization")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    logger.info("final_report_written", extra={"extra_fields": {"path": str(path)}})
    return path


__all__ = [
    "build_model",
    "calculate_directional_accuracy",
    "create_sequences",
    "evaluate_model",
    "generate_forecast",
    "generate_final_report",
    "generate_report",
    "load_data",
    "predict_stock_price",
    "preprocess_data",
    "run_pipeline",
    "save_prediction_plot",
    "save_prediction_report",
    "train_model",
]
