"""Flask HTTP entry point for the NeuroTrade prediction backend.

The previous implementation mixed validation, orchestration, file I/O,
and response serialization in one file. This rewrite keeps the on-the-
wire contract identical (the React frontend in ``../src/`` is unchanged)
while moving all business logic into ``api/services.py`` so the route
layer is a thin shell that maps cleanly to a future FastAPI gateway.

Key improvements:

- ``debug=True`` removed; settings are read from :mod:`core.config`.
- CORS limited to a configurable allow-list.
- Every request gets a correlation id surfaced in logs and responses.
- Every error returns a consistent JSON envelope with a stable code.
- Path-traversal protection on the file-download route.
- Structured logs for request lifecycle and timing.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Any

import matplotlib

matplotlib.use("Agg")  # set non-interactive backend before any pyplot import

# Ensure the repository root and this directory are importable when the
# module is launched directly (``python app.py``) or via a WSGI server.
# ``api/`` is not a Python package because its parent directory contains
# a hyphen, so we expose ``services.py`` by adding the API directory to
# ``sys.path`` rather than referring to it as a package.
_API_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _API_DIR.parent
for _path in (str(_REPO_ROOT), str(_API_DIR)):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from flask import Flask, Response, g, jsonify, request, send_file  # noqa: E402
from flask_cors import CORS  # noqa: E402

from core.config import get_app_config  # noqa: E402
from core.errors import ErrorCode, error_envelope  # noqa: E402
from core.logging_setup import (  # noqa: E402
    configure_logging,
    get_logger,
    new_request_id,
    set_request_id,
)
from services import (  # type: ignore[import-not-found]  # noqa: E402
    ValidationFailure,
    normalize_symbols,
    resolve_result_file,
    run_prediction,
)
from market_data import fetch_market_overview, fetch_indices, fetch_quote, fetch_equity_quotes, fetch_commodities, INDICES, EQUITIES, COMMODITIES
from technicals import compute_technicals
from news import fetch_market_news
from forecast_engine import generate_forecast

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------


def _build_app() -> Flask:
    app_config = get_app_config()
    configure_logging(level=app_config.log_level, json_output=app_config.log_json)
    logger = get_logger(__name__)

    app = Flask(__name__)
    app.config["JSON_SORT_KEYS"] = False

    CORS(
        app,
        resources={r"/*": {"origins": list(app_config.cors_origins)}},
        supports_credentials=False,
    )

    # ---- Request lifecycle ------------------------------------------------

    @app.before_request
    def _attach_request_id() -> None:
        request_id = request.headers.get("X-Request-Id") or new_request_id()
        g.request_id = request_id
        set_request_id(request_id)
        logger.info(
            "http_request_start",
            extra={
                "extra_fields": {
                    "method": request.method,
                    "path": request.path,
                    "remote_addr": request.remote_addr,
                }
            },
        )

    @app.after_request
    def _emit_request_id(response: Response) -> Response:
        request_id = getattr(g, "request_id", None)
        if request_id:
            response.headers["X-Request-Id"] = request_id
        logger.info(
            "http_request_end",
            extra={
                "extra_fields": {
                    "status": response.status_code,
                    "method": request.method,
                    "path": request.path,
                }
            },
        )
        set_request_id(None)
        return response

    # ---- Error handlers (consistent JSON envelopes) -----------------------

    def _error_response(message: str, *, code: ErrorCode | str, status: int, details: Any = None) -> Response:
        body = error_envelope(
            message,
            code=code,
            details=details,
            request_id=getattr(g, "request_id", None),
        )
        response = jsonify(body)
        response.status_code = status
        return response

    @app.errorhandler(ValidationFailure)
    def _handle_validation_failure(exc: ValidationFailure) -> Response:
        logger.info(
            "validation_failure",
            extra={"extra_fields": {"code": exc.code, "message": exc.message}},
        )
        return _error_response(exc.message, code=exc.code, status=exc.status, details=exc.details)

    @app.errorhandler(404)
    def _handle_404(_exc) -> Response:
        return _error_response("Not Found", code=ErrorCode.FILE_NOT_FOUND, status=404)

    @app.errorhandler(405)
    def _handle_405(_exc) -> Response:
        return _error_response("Method Not Allowed", code=ErrorCode.INVALID_REQUEST, status=405)

    @app.errorhandler(Exception)
    def _handle_unexpected(exc: Exception) -> Response:
        logger.exception("unhandled_exception", extra={"extra_fields": {"error": str(exc)}})
        return _error_response(
            "Unexpected error occurred",
            code=ErrorCode.INTERNAL_ERROR,
            status=500,
            details=str(exc),
        )

    # ---- Routes -----------------------------------------------------------

    @app.route("/health", methods=["GET"])
    def health() -> Response:
        return jsonify({"status": "ok", "version": "phase-0"})

    @app.route("/predict", methods=["POST"])
    def predict() -> Response:
        payload = request.get_json(silent=True) or {}
        symbols = normalize_symbols(payload.get("symbols"))
        result = run_prediction(symbols)
        result["request_id"] = getattr(g, "request_id", None)
        return jsonify(result)

    @app.route("/api/results/<path:filename>", methods=["GET"])
    def serve_result_file(filename: str) -> Response:
        path = resolve_result_file(filename)
        if path is None:
            return _error_response(
                "File not found",
                code=ErrorCode.FILE_NOT_FOUND,
                status=404,
                details={"filename": filename},
            )

        mime_type = _mime_for(filename)
        response = send_file(
            path,
            mimetype=mime_type,
            as_attachment=True,
            download_name=os.path.basename(filename),
        )
        response.headers["Content-Disposition"] = f"attachment; filename={os.path.basename(filename)}"
        return response

    # ---- Market Data Routes (real-time via yfinance) ----------------------

    @app.route("/market/overview", methods=["GET"])
    def market_overview() -> Response:
        """Full market overview — indices, gainers, losers, commodities."""
        data = fetch_market_overview()
        data["request_id"] = getattr(g, "request_id", None)
        return jsonify(data)

    @app.route("/market/indices", methods=["GET"])
    def market_indices() -> Response:
        """Live Indian index quotes."""
        return jsonify({"indices": fetch_indices(), "request_id": getattr(g, "request_id", None)})

    @app.route("/market/quote/<symbol>", methods=["GET"])
    def market_quote(symbol: str) -> Response:
        """Single symbol quote."""
        # Resolve symbol to yfinance ticker
        yf_symbol = INDICES.get(symbol.upper()) or EQUITIES.get(symbol.upper()) or COMMODITIES.get(symbol.upper()) or symbol
        quote = fetch_quote(yf_symbol)
        if quote is None:
            return _error_response("No data for symbol", code=ErrorCode.NO_VALID_DATA, status=404, details={"symbol": symbol})
        quote["request_id"] = getattr(g, "request_id", None)
        return jsonify(quote)

    @app.route("/market/equities", methods=["GET"])
    def market_equities() -> Response:
        """Top Indian equity quotes."""
        symbols = request.args.get("symbols")
        symbol_list = [s.strip().upper() for s in symbols.split(",")] if symbols else None
        return jsonify({"equities": fetch_equity_quotes(symbol_list), "request_id": getattr(g, "request_id", None)})

    @app.route("/market/commodities", methods=["GET"])
    def market_commodities() -> Response:
        """Commodity prices in INR."""
        return jsonify({"commodities": fetch_commodities(), "request_id": getattr(g, "request_id", None)})

    @app.route("/market/technicals/<symbol>", methods=["GET"])
    def market_technicals(symbol: str) -> Response:
        """Full technical analysis for a symbol."""
        yf_symbol = INDICES.get(symbol.upper()) or EQUITIES.get(symbol.upper()) or COMMODITIES.get(symbol.upper()) or symbol
        result = compute_technicals(yf_symbol)
        if result is None:
            return _error_response("Unable to compute technicals", code=ErrorCode.NO_VALID_DATA, status=404, details={"symbol": symbol})
        result["request_id"] = getattr(g, "request_id", None)
        return jsonify(result)

    # ---- News Intelligence -----------------------------------------------

    @app.route("/market/news", methods=["GET"])
    def market_news() -> Response:
        """Real financial news with sector mapping and sentiment."""
        news = fetch_market_news()
        return jsonify({"news": news, "count": len(news), "request_id": getattr(g, "request_id", None)})

    # ---- Universal AI Forecast Engine -------------------------------------

    @app.route("/forecast/<symbol>", methods=["GET"])
    def universal_forecast(symbol: str) -> Response:
        """
        Universal AI forecast — works for indices, equities, and commodities.

        Returns a unified intelligence package: asset detection, real-time
        price, technical analysis, probabilistic outlook, asset-aware
        narrative, key drivers, and relevant themes.
        """
        result = generate_forecast(symbol)
        if result is None:
            return _error_response(
                "Unable to generate forecast for this asset. It may be unsupported, illiquid, or temporarily unavailable.",
                code=ErrorCode.NO_VALID_DATA,
                status=404,
                details={"symbol": symbol},
            )
        result["request_id"] = getattr(g, "request_id", None)
        return jsonify(result)

    return app


def _mime_for(filename: str) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith(".txt"):
        return "text/plain"
    if lower.endswith(".json"):
        return "application/json"
    return "application/octet-stream"


# ---------------------------------------------------------------------------
# Module-level app for WSGI / Flask CLI usage
# ---------------------------------------------------------------------------

app = _build_app()


if __name__ == "__main__":
    cfg = get_app_config()
    # debug stays False unless explicitly enabled via NEUROTRADE_DEBUG=1
    app.run(host=cfg.host, port=cfg.port, debug=cfg.debug)
