"""Structured logging for the NeuroTrade backend.

Provides JSON-formatted logs by default (production-friendly) with an
optional human-readable fallback for local development. Includes a
``contextvars``-backed request id so every log line emitted while
serving a request is automatically correlated.

Designed to be framework-agnostic: works for the Flask app today and
will continue to work when a FastAPI gateway is introduced.
"""

from __future__ import annotations

import json
import logging
import sys
import time
import uuid
from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any, Iterator, Mapping


_REQUEST_ID: ContextVar[str | None] = ContextVar("neurotrade_request_id", default=None)
_EXTRA_CONTEXT: ContextVar[Mapping[str, Any] | None] = ContextVar(
    "neurotrade_extra_context", default=None
)

_CONFIGURED = False


def new_request_id() -> str:
    """Generate a short, sortable-ish request id."""
    return uuid.uuid4().hex[:12]


def set_request_id(request_id: str | None) -> None:
    _REQUEST_ID.set(request_id)


def get_request_id() -> str | None:
    return _REQUEST_ID.get()


@contextmanager
def log_context(**fields: Any) -> Iterator[None]:
    """Attach extra fields to every log emitted inside the block."""
    previous = _EXTRA_CONTEXT.get()
    merged = dict(previous or {})
    merged.update(fields)
    token = _EXTRA_CONTEXT.set(merged)
    try:
        yield
    finally:
        _EXTRA_CONTEXT.reset(token)


@contextmanager
def timed(logger: logging.Logger, event: str, **fields: Any) -> Iterator[dict]:
    """Time a block and emit a structured log line on exit.

    Usage:
        with timed(logger, "predict_stock_price", symbol="AAPL"):
            ...
    """
    started = time.perf_counter()
    payload: dict[str, Any] = {}
    try:
        yield payload
    finally:
        duration_ms = round((time.perf_counter() - started) * 1000.0, 2)
        logger.info(
            event,
            extra={"extra_fields": {"duration_ms": duration_ms, **fields, **payload}},
        )


class _JsonFormatter(logging.Formatter):
    """Render log records as a single JSON line with structured fields."""

    _RESERVED = {
        "name",
        "msg",
        "args",
        "levelname",
        "levelno",
        "pathname",
        "filename",
        "module",
        "exc_info",
        "exc_text",
        "stack_info",
        "lineno",
        "funcName",
        "created",
        "msecs",
        "relativeCreated",
        "thread",
        "threadName",
        "processName",
        "process",
        "message",
        "asctime",
        "extra_fields",
        "taskName",  # Python 3.12+
    }

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }

        request_id = _REQUEST_ID.get()
        if request_id:
            payload["request_id"] = request_id

        ctx = _EXTRA_CONTEXT.get()
        if ctx:
            payload.update(ctx)

        extra = getattr(record, "extra_fields", None)
        if isinstance(extra, Mapping):
            payload.update(extra)

        # Pull through any ad-hoc attributes attached to the record
        for key, value in record.__dict__.items():
            if key in self._RESERVED or key.startswith("_"):
                continue
            if key in payload or value is None:
                continue
            payload[key] = value

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        try:
            return json.dumps(payload, default=str)
        except (TypeError, ValueError):
            return json.dumps({"ts": payload["ts"], "level": payload["level"], "msg": payload["msg"]})


class _PlainFormatter(logging.Formatter):
    """Human-readable formatter for local development."""

    def format(self, record: logging.LogRecord) -> str:
        base = super().format(record)
        request_id = _REQUEST_ID.get()
        prefix = f"[{request_id}] " if request_id else ""
        extra = getattr(record, "extra_fields", None)
        if isinstance(extra, Mapping) and extra:
            base += " " + " ".join(f"{k}={v}" for k, v in extra.items())
        return prefix + base


def configure_logging(level: str = "INFO", *, json_output: bool = True) -> None:
    """Idempotently configure the root logger.

    Safe to call from multiple entry points; only the first call has effect.
    """
    global _CONFIGURED
    if _CONFIGURED:
        return

    handler = logging.StreamHandler(sys.stdout)
    if json_output:
        handler.setFormatter(_JsonFormatter())
    else:
        handler.setFormatter(_PlainFormatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))

    root = logging.getLogger()
    # Replace existing handlers so duplicate configurations don't double-log.
    for existing in list(root.handlers):
        root.removeHandler(existing)
    root.addHandler(handler)
    root.setLevel(level.upper())

    # Quiet noisy third-party loggers without losing warnings.
    for noisy in ("yfinance", "urllib3", "matplotlib", "tensorflow"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

    _CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
    """Return a namespaced logger; auto-configures on first use."""
    if not _CONFIGURED:
        configure_logging()
    return logging.getLogger(name)
