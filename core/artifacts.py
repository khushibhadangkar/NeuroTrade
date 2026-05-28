"""Persistence of structured run artifacts.

Each prediction run writes a single JSON file under ``results/runs/``
that captures the full record needed to replay or audit the run:
inputs, hyperparameters, metrics, predictions, technical indicators,
and the model version. The existing PNG and TXT outputs are preserved
unchanged - this is purely additive.
"""

from __future__ import annotations

import json
import math
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable, Mapping

from core.config import ModelConfig, get_app_config
from core.logging_setup import get_logger

logger = get_logger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _coerce_finite(value: Any) -> Any:
    """Convert numpy scalars to floats and replace non-finite values with None."""
    if value is None:
        return None
    try:
        # numpy scalars expose .item(); plain Python floats/ints don't.
        if hasattr(value, "item"):
            value = value.item()
    except Exception:  # pragma: no cover - defensive
        pass
    if isinstance(value, float) and not math.isfinite(value):
        return None
    return value


def _serializable(value: Any) -> Any:
    """Recursively coerce a value into a JSON-serializable form."""
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return _coerce_finite(value)
    if hasattr(value, "item") and not isinstance(value, (list, tuple, dict)):
        return _coerce_finite(value)
    if isinstance(value, Mapping):
        return {str(k): _serializable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serializable(v) for v in value]
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value)


def new_run_id(symbol: str) -> str:
    """Generate a sortable run id for a given symbol."""
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return f"{symbol}-{stamp}-{uuid.uuid4().hex[:6]}"


# ---------------------------------------------------------------------------
# Artifact data structures
# ---------------------------------------------------------------------------


@dataclass
class RunArtifact:
    """Canonical, JSON-serializable record of a single prediction run."""

    run_id: str
    symbol: str
    created_at: str
    model_version: str
    hyperparameters: dict[str, Any]
    metrics: dict[str, Any]
    predictions: list[dict[str, Any]]
    technical_indicators: dict[str, Any] = field(default_factory=dict)
    inputs: dict[str, Any] = field(default_factory=dict)
    timings: dict[str, Any] = field(default_factory=dict)
    schema_version: str = "1.0"

    def to_dict(self) -> dict[str, Any]:
        return _serializable(asdict(self))


def build_artifact(
    *,
    symbol: str,
    metrics: Mapping[str, Any],
    predictions: Iterable[Mapping[str, Any]],
    model_config: ModelConfig,
    technical_indicators: Mapping[str, Any] | None = None,
    inputs: Mapping[str, Any] | None = None,
    timings: Mapping[str, Any] | None = None,
    run_id: str | None = None,
) -> RunArtifact:
    """Construct a RunArtifact from the pieces emitted by the pipeline."""
    return RunArtifact(
        run_id=run_id or new_run_id(symbol),
        symbol=symbol,
        created_at=_utc_now_iso(),
        model_version=model_config.version,
        hyperparameters={
            "sequence_length": model_config.sequence_length,
            "train_split": model_config.train_split,
            "epochs": model_config.epochs,
            "batch_size": model_config.batch_size,
            "dropout": model_config.dropout,
            "lstm_units_1": model_config.lstm_units_1,
            "lstm_units_2": model_config.lstm_units_2,
            "dense_units": model_config.dense_units,
            "optimizer": model_config.optimizer,
            "loss": model_config.loss,
            "learning_rate": model_config.learning_rate,
            "early_stopping_patience": model_config.early_stopping_patience,
            "history_days": model_config.history_days,
        },
        metrics={k: _coerce_finite(v) for k, v in metrics.items()},
        predictions=[_serializable(row) for row in predictions],
        technical_indicators=dict(technical_indicators or {}),
        inputs=dict(inputs or {}),
        timings=dict(timings or {}),
    )


# ---------------------------------------------------------------------------
# Persistence
# ---------------------------------------------------------------------------


def write_artifact(artifact: RunArtifact, *, runs_dir: Path | None = None) -> Path:
    """Persist a run artifact as JSON and update the per-symbol latest pointer."""
    runs_dir = runs_dir or get_app_config().runs_dir
    runs_dir.mkdir(parents=True, exist_ok=True)

    payload = artifact.to_dict()
    target = runs_dir / f"{artifact.run_id}.json"
    target.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")

    # Maintain a stable "latest" pointer per symbol so consumers can fetch
    # the most recent run without scanning the directory.
    latest_path = runs_dir / f"{artifact.symbol}_latest.json"
    latest_path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")

    logger.info(
        "run_artifact_written",
        extra={
            "extra_fields": {
                "run_id": artifact.run_id,
                "symbol": artifact.symbol,
                "path": str(target),
            }
        },
    )
    return target


def read_latest_artifact(symbol: str, *, runs_dir: Path | None = None) -> dict[str, Any] | None:
    """Return the latest artifact for a symbol, or None if none exist."""
    runs_dir = runs_dir or get_app_config().runs_dir
    latest_path = runs_dir / f"{symbol}_latest.json"
    if not latest_path.exists():
        return None
    try:
        return json.loads(latest_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning(
            "run_artifact_read_failed",
            extra={"extra_fields": {"symbol": symbol, "error": str(exc)}},
        )
        return None
