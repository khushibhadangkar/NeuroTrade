"""Centralized configuration for the NeuroTrade prediction backend.

All hyperparameters, paths, and runtime knobs live here as immutable
dataclasses. The existing Flask app, the CLI, and a future FastAPI gateway
should all import from this module rather than hard-coding values.

Values can be overridden via environment variables so the same code can
run unchanged in dev, test, and production.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field, replace
from functools import lru_cache
from pathlib import Path
from typing import Tuple


# ---------------------------------------------------------------------------
# Path resolution
# ---------------------------------------------------------------------------

# Repository root, resolved relative to this file. Used as the canonical
# anchor for results/, runs/, and any other on-disk artifacts so behavior
# is identical regardless of which entry point launches the process.
PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent


def _env_str(key: str, default: str) -> str:
    value = os.getenv(key)
    return value if value not in (None, "") else default


def _env_int(key: str, default: int) -> int:
    raw = os.getenv(key)
    if raw in (None, ""):
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_float(key: str, default: float) -> float:
    raw = os.getenv(key)
    if raw in (None, ""):
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_bool(key: str, default: bool) -> bool:
    raw = os.getenv(key)
    if raw in (None, ""):
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(key: str, default: Tuple[str, ...]) -> Tuple[str, ...]:
    raw = os.getenv(key)
    if raw in (None, ""):
        return default
    return tuple(item.strip() for item in raw.split(",") if item.strip())


# ---------------------------------------------------------------------------
# Model configuration
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ModelConfig:
    """Hyperparameters and training knobs for the LSTM forecaster.

    Defaults preserve the historical behavior of ``predict_stock_price``
    so existing reports remain reproducible.
    """

    # Data window
    history_days: int = 365
    sequence_length: int = 60
    train_split: float = 0.80

    # Architecture
    lstm_units_1: int = 128
    lstm_units_2: int = 64
    dense_units: int = 32
    dropout: float = 0.2

    # Training
    epochs: int = 100
    batch_size: int = 32
    optimizer: str = "adam"
    loss: str = "huber"
    learning_rate: float | None = None  # None => optimizer default
    early_stopping_patience: int = 10
    early_stopping_monitor: str = "loss"
    progress_log_interval: int = 10

    # Evaluation
    report_tail: int = 30  # number of trailing days surfaced in the API/report

    # Versioning. Bump when behavior changes so cached artifacts stay coherent.
    version: str = "1.0.0"

    def with_overrides(self, **overrides) -> "ModelConfig":
        """Return a copy of the config with the supplied overrides applied."""
        return replace(self, **overrides)


# ---------------------------------------------------------------------------
# App / runtime configuration
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class AppConfig:
    """Runtime configuration for the API and surrounding infrastructure."""

    # Paths
    project_root: Path = PROJECT_ROOT
    results_dir: Path = PROJECT_ROOT / "results"
    runs_dir: Path = PROJECT_ROOT / "results" / "runs"
    models_dir: Path = PROJECT_ROOT / "models"  # reserved for Phase 1 caching

    # API
    host: str = field(default_factory=lambda: _env_str("NEUROTRADE_HOST", "127.0.0.1"))
    port: int = field(default_factory=lambda: _env_int("NEUROTRADE_PORT", 5000))
    debug: bool = field(default_factory=lambda: _env_bool("NEUROTRADE_DEBUG", False))
    cors_origins: Tuple[str, ...] = field(
        default_factory=lambda: _env_list(
            "NEUROTRADE_CORS_ORIGINS",
            (
                "*",
                "http://localhost:3000",
                "http://localhost:3003",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:3003",
            ),
        )
    )
    max_symbols_per_request: int = field(
        default_factory=lambda: _env_int("NEUROTRADE_MAX_SYMBOLS", 10)
    )

    # Logging
    log_level: str = field(default_factory=lambda: _env_str("NEUROTRADE_LOG_LEVEL", "INFO"))
    log_json: bool = field(default_factory=lambda: _env_bool("NEUROTRADE_LOG_JSON", True))

    # Feature flags reserved for future phases
    enable_model_cache: bool = field(
        default_factory=lambda: _env_bool("NEUROTRADE_ENABLE_MODEL_CACHE", False)
    )
    enable_async_jobs: bool = field(
        default_factory=lambda: _env_bool("NEUROTRADE_ENABLE_ASYNC_JOBS", False)
    )

    def ensure_directories(self) -> None:
        """Create persistent directories if they don't yet exist."""
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.runs_dir.mkdir(parents=True, exist_ok=True)
        # models_dir is reserved for Phase 1; create lazily only if requested
        if self.enable_model_cache:
            self.models_dir.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Cached accessors
# ---------------------------------------------------------------------------


@lru_cache(maxsize=1)
def get_model_config() -> ModelConfig:
    """Return the process-wide model configuration."""
    return ModelConfig(
        history_days=_env_int("NEUROTRADE_HISTORY_DAYS", 365),
        sequence_length=_env_int("NEUROTRADE_SEQUENCE_LENGTH", 60),
        train_split=_env_float("NEUROTRADE_TRAIN_SPLIT", 0.80),
        epochs=_env_int("NEUROTRADE_EPOCHS", 100),
        batch_size=_env_int("NEUROTRADE_BATCH_SIZE", 32),
        dropout=_env_float("NEUROTRADE_DROPOUT", 0.2),
        learning_rate=(
            _env_float("NEUROTRADE_LEARNING_RATE", -1.0)
            if os.getenv("NEUROTRADE_LEARNING_RATE")
            else None
        ),
        early_stopping_patience=_env_int("NEUROTRADE_ES_PATIENCE", 10),
    )


@lru_cache(maxsize=1)
def get_app_config() -> AppConfig:
    """Return the process-wide app configuration."""
    cfg = AppConfig()
    cfg.ensure_directories()
    return cfg
