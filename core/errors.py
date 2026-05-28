"""Consistent error envelopes for HTTP responses.

Both the current Flask app and a future FastAPI gateway should return
errors in this shape so the frontend has a single contract:

    {
        "error": "Human-readable summary",
        "details": "Optional longer explanation",
        "code": "stable_machine_code",
        "request_id": "optional correlation id"
    }
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Mapping


class ErrorCode(str, Enum):
    """Stable machine-readable codes that survive refactors and frontend rebuilds."""

    INVALID_REQUEST = "invalid_request"
    NO_SYMBOLS = "no_symbols"
    TOO_MANY_SYMBOLS = "too_many_symbols"
    INVALID_SYMBOL = "invalid_symbol"
    DATA_FETCH_FAILED = "data_fetch_failed"
    NO_VALID_DATA = "no_valid_data"
    ANALYSIS_FAILED = "analysis_failed"
    PREDICTION_FAILED = "prediction_failed"
    FILE_NOT_FOUND = "file_not_found"
    INTERNAL_ERROR = "internal_error"


def error_envelope(
    message: str,
    *,
    code: ErrorCode | str = ErrorCode.INTERNAL_ERROR,
    details: Any = None,
    request_id: str | None = None,
    extra: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Build the canonical error response body."""
    code_value = code.value if isinstance(code, ErrorCode) else str(code)
    body: dict[str, Any] = {"error": message, "code": code_value}
    if details is not None:
        body["details"] = details
    if request_id:
        body["request_id"] = request_id
    if extra:
        for key, value in extra.items():
            if key not in body:
                body[key] = value
    return body
