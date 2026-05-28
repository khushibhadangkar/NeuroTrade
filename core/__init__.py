"""Shared core library for the NeuroTrade prediction backend.

This package centralizes configuration, logging, error envelopes, and run
artifact persistence so the existing Flask API and any future FastAPI
gateway can share a single source of truth.
"""

from core.config import (
    AppConfig,
    ModelConfig,
    get_app_config,
    get_model_config,
)
from core.errors import ErrorCode, error_envelope
from core.logging_setup import configure_logging, get_logger, new_request_id

__all__ = [
    "AppConfig",
    "ModelConfig",
    "ErrorCode",
    "configure_logging",
    "error_envelope",
    "get_app_config",
    "get_logger",
    "get_model_config",
    "new_request_id",
]
