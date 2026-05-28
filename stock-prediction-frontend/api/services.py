"""Framework-agnostic service layer for the prediction API.

Routes (Flask today, FastAPI tomorrow) should be thin shells that
deserialize input, call into this module, and serialize the result.
This keeps the request/response logic decoupled from the underlying
HTTP framework.
"""

from __future__ import annotations

import re
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Iterable

import pandas as pd

from core.config import get_app_config, get_model_config
from core.logging_setup import get_logger, log_context, timed
from data.data_fetching import get_stock_data
from model_training.pipeline import run_pipeline
from utils.data_analysis_and_visualization import main_analysis
from utils.trend_signals import calculate_trend_signals

logger = get_logger(__name__)


_TICKER_RE = re.compile(r"^[A-Z][A-Z0-9.\-]{0,9}$")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


@dataclass
class ValidationFailure(Exception):
    """Raised when the inbound request payload cannot be processed."""

    message: str
    code: str = "invalid_request"
    details: Any = None
    status: int = 400

    def __str__(self) -> str:  # pragma: no cover - cosmetic
        return self.message


def normalize_symbols(raw: Iterable[Any] | None) -> list[str]:
    """Normalize an arbitrary list of inbound symbols.

    Strips whitespace, uppercases, deduplicates while preserving order,
    enforces a basic ticker shape, and applies the configured cap on
    symbols per request.
    """
    if raw is None:
        raise ValidationFailure("No stock symbols provided", code="no_symbols")
    if not isinstance(raw, (list, tuple)):
        raise ValidationFailure(
            "Symbols must be supplied as a list",
            code="invalid_request",
            details=f"Got {type(raw).__name__}",
        )

    seen: set[str] = set()
    cleaned: list[str] = []
    invalid: list[str] = []
    for entry in raw:
        if not isinstance(entry, str):
            invalid.append(repr(entry))
            continue
        token = entry.strip().upper()
        if not token:
            continue
        if not _TICKER_RE.match(token):
            invalid.append(token)
            continue
        if token in seen:
            continue
        seen.add(token)
        cleaned.append(token)

    if not cleaned:
        raise ValidationFailure(
            "No valid ticker symbols were provided",
            code="invalid_symbol",
            details={"invalid": invalid} if invalid else None,
        )

    cap = get_app_config().max_symbols_per_request
    if len(cleaned) > cap:
        raise ValidationFailure(
            f"Too many symbols (max {cap})",
            code="too_many_symbols",
            details={"received": len(cleaned), "limit": cap},
        )

    return cleaned


# ---------------------------------------------------------------------------
# Result aggregation
# ---------------------------------------------------------------------------


@dataclass
class PredictionResult:
    """Per-symbol prediction outcome surfaced to API consumers."""

    symbol: str
    predictions: list[dict[str, Any]] | None = None
    metrics: dict[str, Any] | None = None
    technical_analysis: dict[str, Any] = field(default_factory=dict)
    artifact_path: str | None = None
    error: str | None = None


def _company_frame(company_list: list[pd.DataFrame], symbol: str) -> pd.DataFrame | None:
    for company in company_list:
        try:
            if company["company_name"].iloc[0] == symbol:
                return company
        except Exception:  # pragma: no cover - defensive
            continue
    return None


def _forecast_to_rows(forecast_df: pd.DataFrame, *, tail: int) -> list[dict[str, Any]]:
    last_n = forecast_df.tail(tail)
    rows: list[dict[str, Any]] = []
    for date, row in last_n.iterrows():
        rows.append(
            {
                "date": str(date),
                "actual": float(row["Close"]),
                "predicted": float(row["Predictions"]),
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Public service entry point
# ---------------------------------------------------------------------------


def run_prediction(symbols: list[str]) -> dict[str, Any]:
    """Run the full predict-and-analyze flow for a list of symbols.

    Returns the response body the existing frontend expects, plus an
    additional ``run_artifacts`` map pointing at the JSON artifacts
    written under ``results/runs/``.
    """
    config = get_model_config()
    app_config = get_app_config()

    with log_context(symbols=symbols), timed(logger, "predict_request", symbols=symbols):
        try:
            df, company_list, valid_symbols = get_stock_data(symbols)
        except ValueError as exc:
            raise ValidationFailure(
                "No valid data found for any of the provided symbols",
                code="no_valid_data",
                details=str(exc),
                status=400,
            )

        invalid = [s for s in symbols if s not in valid_symbols]
        if invalid:
            logger.warning(
                "predict_invalid_symbols",
                extra={"extra_fields": {"invalid": invalid}},
            )

        try:
            if valid_symbols:
                main_analysis(company_list, valid_symbols)
        except Exception as exc:  # noqa: BLE001
            logger.exception("technical_analysis_failed", extra={"extra_fields": {"error": str(exc)}})

        results: dict[str, PredictionResult] = {symbol: PredictionResult(symbol=symbol) for symbol in symbols}

        for symbol in symbols:
            if symbol not in valid_symbols:
                results[symbol].error = "No valid data available"
                results[symbol].technical_analysis = {"error": "No valid data available"}
                continue

            stock_data = _company_frame(company_list, symbol)

            try:
                with timed(logger, "predict_symbol", symbol=symbol):
                    forecast_df, metrics, extra = run_pipeline(symbol, raw_data=stock_data, config=config)

                technical = calculate_trend_signals(forecast_df, stock_data)

                results[symbol].predictions = _forecast_to_rows(forecast_df, tail=config.report_tail)
                results[symbol].metrics = {
                    "rmse": float(metrics["rmse"]),
                    "normalized_rmse": float(metrics["normalized_rmse"]),
                    "mae": float(metrics["mae"]),
                    "r2": float(metrics["r2"]),
                    "directional_accuracy": float(metrics["directional_accuracy"]),
                }
                results[symbol].technical_analysis = technical
                results[symbol].artifact_path = extra.get("artifact_path")

            except Exception as exc:  # noqa: BLE001
                logger.exception(
                    "predict_symbol_failed",
                    extra={"extra_fields": {"symbol": symbol, "error": str(exc)}},
                )
                results[symbol].error = str(exc)
                results[symbol].technical_analysis = {"error": str(exc)}

        # Mirror the on-disk results directory for the legacy download route.
        mirror_results_directory()

        body = _serialize_response(results)
        if not any(r.predictions for r in results.values()):
            raise ValidationFailure(
                "Failed to generate predictions for all symbols",
                code="prediction_failed",
                details=body.get("errors"),
                status=500,
            )
        return body


def _serialize_response(results: dict[str, PredictionResult]) -> dict[str, Any]:
    predictions: dict[str, Any] = {}
    metrics: dict[str, Any] = {}
    technical: dict[str, Any] = {}
    artifacts: dict[str, str] = {}
    errors: dict[str, str] = {}

    for symbol, result in results.items():
        predictions[symbol] = result.predictions
        metrics[symbol] = result.metrics
        technical[symbol] = result.technical_analysis
        if result.artifact_path:
            artifacts[symbol] = result.artifact_path
        if result.error:
            errors[symbol] = result.error

    body: dict[str, Any] = {
        "predictions": predictions,
        "metrics": metrics,
        "technical_analysis": technical,
        "run_artifacts": artifacts,
    }
    if errors:
        body["errors"] = errors
    return body


# ---------------------------------------------------------------------------
# Result file mirroring
# ---------------------------------------------------------------------------


_LAST_MIRROR_AT: float = 0.0
_MIRROR_INTERVAL_S = 30.0
_API_RESULTS_DIR = Path(__file__).resolve().parent / "results"


def mirror_results_directory(force: bool = False) -> None:
    """Copy ``results/`` into the API's local mirror, throttled.

    The Flask download route serves files from the API directory. Rather
    than recopying on every request (the previous behavior), only copy
    when the source has changed since the last mirror, or every 30s.
    """
    global _LAST_MIRROR_AT

    source = get_app_config().results_dir
    if not source.exists():
        return

    now = time.time()
    if not force and (now - _LAST_MIRROR_AT) < _MIRROR_INTERVAL_S:
        return

    try:
        _API_RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        for entry in source.iterdir():
            if entry.is_file():
                shutil.copy2(entry, _API_RESULTS_DIR / entry.name)
            elif entry.is_dir():
                # Mirror runs/ subdirectory too.
                target = _API_RESULTS_DIR / entry.name
                target.mkdir(parents=True, exist_ok=True)
                for sub in entry.iterdir():
                    if sub.is_file():
                        shutil.copy2(sub, target / sub.name)
        _LAST_MIRROR_AT = now
    except Exception as exc:  # noqa: BLE001
        logger.warning(
            "results_mirror_failed",
            extra={"extra_fields": {"error": str(exc)}},
        )


def resolve_result_file(filename: str) -> Path | None:
    """Return the resolved path of a result file or ``None`` if missing.

    Guards against path traversal by ensuring the resolved path stays
    within the API results directory.
    """
    mirror_results_directory()
    candidate = (_API_RESULTS_DIR / filename).resolve()
    try:
        candidate.relative_to(_API_RESULTS_DIR.resolve())
    except ValueError:
        logger.warning(
            "result_file_traversal_attempt",
            extra={"extra_fields": {"filename": filename}},
        )
        return None
    return candidate if candidate.exists() and candidate.is_file() else None
