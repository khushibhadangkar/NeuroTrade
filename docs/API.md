# NeuroTrade OS — API Reference

Base URL: `http://localhost:5001` (dev) or configured via `NEUROTRADE_API_URL`

## Endpoints

### `GET /health`

Health check — verify backend availability.

**Response** `200`
```json
{
  "status": "ok",
  "version": "phase-0"
}
```

---

### `POST /predict`

Run the LSTM prediction pipeline for one or more symbols.

**Request**
```json
{
  "symbols": ["AAPL", "NVDA"]
}
```

**Validation**
- `symbols` must be a non-empty array of strings
- Each symbol: 1–5 uppercase letters, digits, dots, or hyphens
- Maximum 10 symbols per request (configurable via `NEUROTRADE_MAX_SYMBOLS`)

**Response** `200`
```json
{
  "predictions": {
    "AAPL": [
      { "date": "2024-11-27 00:00:00", "actual": 234.93, "predicted": 228.69 },
      ...
    ],
    "INVALID": null
  },
  "metrics": {
    "AAPL": {
      "rmse": 4.22,
      "normalized_rmse": 1.85,
      "mae": 3.57,
      "r2": -0.2662,
      "directional_accuracy": 55.10
    }
  },
  "technical_analysis": {
    "AAPL": {
      "moving_averages": "Bullish",
      "volume_trend": "High",
      "price_trend": "Upward"
    }
  },
  "run_artifacts": {
    "AAPL": "/path/to/results/runs/AAPL-20240101T120000Z-abc123.json"
  },
  "errors": {
    "INVALID": "No valid data available"
  },
  "request_id": "a1b2c3d4e5f6"
}
```

**Error Responses**

`400` — Validation failure
```json
{
  "error": "No valid ticker symbols were provided",
  "code": "invalid_symbol",
  "details": { "invalid": ["???"] },
  "request_id": "..."
}
```

`500` — Server error
```json
{
  "error": "Unexpected error occurred",
  "code": "internal_error",
  "details": "...",
  "request_id": "..."
}
```

---

### `GET /api/results/:filename`

Download a generated result file (PNG plot or TXT report).

**Response** — File download with appropriate MIME type.

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `no_symbols` | 400 | Empty symbols array |
| `invalid_symbol` | 400 | Ticker format invalid |
| `too_many_symbols` | 400 | Exceeds max per request |
| `no_valid_data` | 400 | No market data for symbols |
| `prediction_failed` | 500 | Model failed for all symbols |
| `internal_error` | 500 | Unexpected server error |
| `file_not_found` | 404 | Result file doesn't exist |

---

## Headers

**Request**
- `Content-Type: application/json`
- `X-Request-Id: <optional>` — If provided, used as correlation ID

**Response**
- `X-Request-Id: <id>` — Always present, correlates with logs

---

## Rate Limits

Currently none enforced. Phase 2 will add per-IP rate limiting.

---

## Timing

Typical response times:
- `/health` — <50ms
- `/predict` (1 symbol) — 30–90 seconds (LSTM training)
- `/predict` (5 symbols) — 2–5 minutes
- `/api/results/:file` — <100ms
