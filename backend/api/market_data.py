"""
Real-time Indian market data service using yfinance.

This module provides live market data for:
- Indian indices (NIFTY, BANKNIFTY, SENSEX)
- Indian equities (NSE-listed stocks)
- Commodities (Gold, Silver, Crude via MCX proxies)

yfinance provides 15-minute delayed data for Indian markets (free).
For true real-time, replace with NSE WebSocket or a paid feed.
"""

from __future__ import annotations

import time
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

from core.logging_setup import get_logger

logger = get_logger(__name__)

# ─── Symbol mappings ───────────────────────────────────────────────────────

INDICES = {
    "NIFTY": "^NSEI",
    "BANKNIFTY": "^NSEBANK",
    "SENSEX": "^BSESN",
    "FINNIFTY": "NIFTY_FIN_SERVICE.NS",
}

EQUITIES = {
    "RELIANCE": "RELIANCE.NS",
    "HDFCBANK": "HDFCBANK.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "INFY": "INFY.NS",
    "TCS": "TCS.NS",
    "BHARTIARTL": "BHARTIARTL.NS",
    "SBIN": "SBIN.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
    "ITC": "ITC.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "LT": "LT.NS",
    "AXISBANK": "AXISBANK.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "MARUTI": "MARUTI.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "TATAMOTORS": "TATAMOTORS.NS",
    "WIPRO": "WIPRO.NS",
    "HCLTECH": "HCLTECH.NS",
    "TITAN": "TITAN.NS",
    "ADANIENT": "ADANIENT.NS",
}

# Commodity proxies (ETFs/futures that track MCX commodities)
COMMODITIES = {
    "GOLD": "GC=F",         # Gold futures (USD)
    "SILVER": "SI=F",       # Silver futures (USD)
    "CRUDE": "CL=F",        # WTI Crude futures (USD)
    "NATGAS": "NG=F",       # Natural Gas futures (USD)
    "COPPER": "HG=F",       # Copper futures (USD)
}

# INR conversion approximate (for commodity display in ₹)
USD_INR_APPROX = 83.5
GOLD_OZ_TO_10G = 0.3215  # 1 troy oz = 31.1g, so 10g = 0.3215 oz
SILVER_OZ_TO_KG = 32.15  # 1 kg = 32.15 troy oz
CRUDE_BBL_TO_INR = USD_INR_APPROX  # direct conversion


# ─── Cache layer ───────────────────────────────────────────────────────────

_cache: dict[str, Any] = {}
_cache_ts: dict[str, float] = {}
CACHE_TTL = 60  # seconds


def _is_cached(key: str) -> bool:
    return key in _cache and (time.time() - _cache_ts.get(key, 0)) < CACHE_TTL


def _set_cache(key: str, value: Any) -> None:
    _cache[key] = value
    _cache_ts[key] = time.time()


# ─── Core data fetchers ────────────────────────────────────────────────────


def fetch_quote(symbol: str) -> dict[str, Any] | None:
    """Fetch current quote for a single symbol."""
    cache_key = f"quote:{symbol}"
    if _is_cached(cache_key):
        return _cache[cache_key]

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.fast_info
        hist = ticker.history(period="2d")

        if hist.empty:
            return None

        current = float(hist["Close"].iloc[-1])
        prev_close = float(hist["Close"].iloc[-2]) if len(hist) > 1 else current
        day_high = float(hist["High"].iloc[-1])
        day_low = float(hist["Low"].iloc[-1])
        day_open = float(hist["Open"].iloc[-1])
        volume = int(hist["Volume"].iloc[-1])

        result = {
            "symbol": symbol,
            "price": round(current, 2),
            "change": round(current - prev_close, 2),
            "changePct": round(((current - prev_close) / prev_close) * 100, 2) if prev_close else 0,
            "open": round(day_open, 2),
            "high": round(day_high, 2),
            "low": round(day_low, 2),
            "prevClose": round(prev_close, 2),
            "volume": volume,
        }

        _set_cache(cache_key, result)
        return result

    except Exception as e:
        logger.warning("fetch_quote_failed", extra={"extra_fields": {"symbol": symbol, "error": str(e)}})
        return None


def fetch_indices() -> list[dict[str, Any]]:
    """Fetch all Indian index quotes using individual downloads (more reliable)."""
    cache_key = "indices:all"
    if _is_cached(cache_key):
        return _cache[cache_key]

    results = []
    for name, symbol in INDICES.items():
        quote = fetch_quote(symbol)
        if quote:
            results.append({
                "symbol": name,
                "yf_symbol": symbol,
                "name": {
                    "NIFTY": "NIFTY 50",
                    "BANKNIFTY": "BANK NIFTY",
                    "SENSEX": "SENSEX",
                    "FINNIFTY": "FIN NIFTY",
                }.get(name, name),
                "value": quote["price"],
                "change": quote["change"],
                "changePct": quote["changePct"],
                "high": quote["high"],
                "low": quote["low"],
                "prevClose": quote["prevClose"],
            })

    _set_cache(cache_key, results)
    return results


def fetch_equity_quotes(symbols: list[str] | None = None) -> list[dict[str, Any]]:
    """Fetch quotes for Indian equities using individual downloads."""
    if symbols is None:
        symbols = list(EQUITIES.keys())[:10]  # Top 10 by default for speed

    cache_key = f"equities:{','.join(sorted(symbols))}"
    if _is_cached(cache_key):
        return _cache[cache_key]

    results = []
    for name in symbols:
        yf_sym = EQUITIES.get(name, f"{name}.NS")
        quote = fetch_quote(yf_sym)
        if quote:
            results.append({
                "symbol": name,
                "yf_symbol": yf_sym,
                "price": quote["price"],
                "change": quote["change"],
                "changePct": quote["changePct"],
                "volume": quote["volume"],
            })

    _set_cache(cache_key, results)
    return results


def fetch_commodities() -> list[dict[str, Any]]:
    """Fetch commodity prices and convert to INR where applicable."""
    cache_key = "commodities:all"
    if _is_cached(cache_key):
        return _cache[cache_key]

    results = []

    conversions = {
        "GOLD": lambda usd: round(usd * GOLD_OZ_TO_10G * USD_INR_APPROX, 0),
        "SILVER": lambda usd: round(usd * SILVER_OZ_TO_KG * USD_INR_APPROX, 0),
        "CRUDE": lambda usd: round(usd * USD_INR_APPROX, 0),
        "NATGAS": lambda usd: round(usd * USD_INR_APPROX, 2),
        "COPPER": lambda usd: round(usd * USD_INR_APPROX / 100, 2),
    }

    units = {
        "GOLD": "₹/10g",
        "SILVER": "₹/kg",
        "CRUDE": "₹/bbl",
        "NATGAS": "₹/mmBtu",
        "COPPER": "₹/kg",
    }

    names = {
        "GOLD": "Gold",
        "SILVER": "Silver",
        "CRUDE": "Crude Oil",
        "NATGAS": "Natural Gas",
        "COPPER": "Copper",
    }

    for name, yf_sym in COMMODITIES.items():
        quote = fetch_quote(yf_sym)
        if quote:
            current_usd = quote["price"]
            change_pct = quote["changePct"]
            convert = conversions.get(name, lambda x: x)
            price_inr = convert(current_usd)

            results.append({
                "symbol": name,
                "name": names.get(name, name),
                "priceUSD": round(current_usd, 2),
                "priceINR": price_inr,
                "changePct": round(change_pct, 2),
                "unit": units.get(name, ""),
            })

    _set_cache(cache_key, results)
    return results


def fetch_market_overview() -> dict[str, Any]:
    """Fetch a complete market overview — indices + top movers + commodities."""
    indices = fetch_indices()
    equities = fetch_equity_quotes()
    commodities = fetch_commodities()

    # Sort equities by change to get gainers/losers
    sorted_equities = sorted(equities, key=lambda x: x.get("changePct", 0), reverse=True)
    gainers = sorted_equities[:5]
    losers = sorted_equities[-5:][::-1]

    return {
        "timestamp": datetime.now().isoformat(),
        "indices": indices,
        "gainers": gainers,
        "losers": losers,
        "commodities": commodities,
    }
