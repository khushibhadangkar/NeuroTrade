"""Technical-trend signal calculations.

Extracted from ``stock-prediction-frontend/api/app.py`` so the logic is
testable in isolation and reusable from any future API surface.

Fixes the previous volume-trend bug where the code attempted to call
``.iloc[0]`` on a scalar mean, depending on whether yfinance returned a
2-D MultiIndex frame for the volume column. We now coerce the comparison
to a plain float in every case.
"""

from __future__ import annotations

from typing import Any, Mapping

import numpy as np
import pandas as pd

from core.logging_setup import get_logger

logger = get_logger(__name__)


def _scalar(value: Any) -> float:
    """Coerce a pandas/numpy scalar (or 1-element Series/array) to a float.

    yfinance occasionally returns columns with an extra MultiIndex level,
    which makes downstream aggregations return 1-element Series instead of
    plain scalars. This helper smooths over both cases.
    """
    if value is None:
        return float("nan")
    if isinstance(value, (pd.Series, pd.DataFrame)):
        if value.empty:
            return float("nan")
        flat = value.to_numpy().ravel()
        return float(flat[0]) if flat.size else float("nan")
    if isinstance(value, np.ndarray):
        flat = value.ravel()
        return float(flat[0]) if flat.size else float("nan")
    try:
        return float(value)
    except (TypeError, ValueError):
        return float("nan")


def _column(df: pd.DataFrame | None, name: str) -> pd.Series | None:
    """Return ``df[name]`` as a 1-D Series, flattening MultiIndex columns."""
    if df is None or not isinstance(df, pd.DataFrame) or name not in df.columns:
        return None
    column = df[name]
    if isinstance(column, pd.DataFrame):
        # Multi-ticker yfinance frames; collapse to the first sub-column.
        if column.empty:
            return None
        column = column.iloc[:, 0]
    return column.dropna()


def calculate_trend_signals(
    predictions_df: pd.DataFrame,
    stock_data: pd.DataFrame | None = None,
) -> dict[str, str]:
    """Derive moving-average / volume / price trend signals.

    Parameters
    ----------
    predictions_df:
        DataFrame containing at least ``Close`` and ``Predictions`` columns
        (the test-window slice produced by the prediction pipeline).
    stock_data:
        Optional historical price frame including a ``Volume`` column. When
        absent, ``volume_trend`` is reported as ``"Unknown"`` rather than
        falsely defaulting to ``"Low"``.

    Returns
    -------
    dict mapping ``moving_averages``, ``volume_trend``, and ``price_trend``
    to ``"Bullish"|"Bearish"|"Upward"|"Downward"|"High"|"Low"|"Unknown"``.
    """
    signals: dict[str, str] = {
        "moving_averages": "Unknown",
        "volume_trend": "Unknown",
        "price_trend": "Unknown",
    }

    close = _column(predictions_df, "Close")
    predictions = _column(predictions_df, "Predictions")

    # Moving-average / mean-reversion stance.
    if close is not None and predictions is not None and not close.empty and not predictions.empty:
        actual_mean = _scalar(close.mean())
        pred_mean = _scalar(predictions.mean())
        if np.isfinite(actual_mean) and np.isfinite(pred_mean):
            signals["moving_averages"] = "Bullish" if actual_mean < pred_mean else "Bearish"

    # Forecast slope: where does the prediction series end vs where it began?
    if predictions is not None and len(predictions) >= 2:
        first_pred = _scalar(predictions.iloc[0])
        last_pred = _scalar(predictions.iloc[-1])
        if np.isfinite(first_pred) and np.isfinite(last_pred):
            signals["price_trend"] = "Upward" if last_pred > first_pred else "Downward"

    # Volume momentum: recent 10 vs full window. Coerce both to float so
    # the comparison works regardless of yfinance frame shape.
    volume = _column(stock_data, "Volume")
    if volume is not None and len(volume) >= 10:
        recent_volume = _scalar(volume.tail(10).mean())
        overall_volume = _scalar(volume.mean())
        if np.isfinite(recent_volume) and np.isfinite(overall_volume):
            signals["volume_trend"] = "High" if recent_volume > overall_volume else "Low"

    return signals


def coerce_signals(raw: Mapping[str, Any] | None) -> dict[str, str]:
    """Best-effort coercion of an external signals dict to the standard shape."""
    if not raw:
        return {"moving_averages": "Unknown", "volume_trend": "Unknown", "price_trend": "Unknown"}
    return {
        "moving_averages": str(raw.get("moving_averages", "Unknown")),
        "volume_trend": str(raw.get("volume_trend", "Unknown")),
        "price_trend": str(raw.get("price_trend", "Unknown")),
    }
