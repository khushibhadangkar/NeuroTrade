"""
Technical analysis engine — computes real indicators and generates
intelligent market structure classifications from price data.

All classifications are derived from calculated data, never hardcoded.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

from core.logging_setup import get_logger

logger = get_logger(__name__)


def compute_technicals(symbol: str, period: str = "3mo") -> dict[str, Any] | None:
    """
    Compute a full technical snapshot for a symbol.

    Returns RSI, MACD, EMA alignment, ATR, Bollinger position,
    trend structure, and an AI-generated interpretation.
    """
    try:
        df = yf.download(symbol, period=period, progress=False)
        if df is None or df.empty or len(df) < 50:
            return None

        close = df["Close"].squeeze()
        high = df["High"].squeeze()
        low = df["Low"].squeeze()

        # ── RSI (14) ──────────────────────────────────────────────────────
        delta = close.diff()
        gain = delta.where(delta > 0, 0.0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
        rs = gain / loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        rsi_value = round(float(rsi.iloc[-1]), 1)

        # ── MACD (12, 26, 9) ─────────────────────────────────────────────
        ema12 = close.ewm(span=12).mean()
        ema26 = close.ewm(span=26).mean()
        macd_line = ema12 - ema26
        signal_line = macd_line.ewm(span=9).mean()
        histogram = macd_line - signal_line
        macd_val = round(float(macd_line.iloc[-1]), 2)
        signal_val = round(float(signal_line.iloc[-1]), 2)
        hist_val = round(float(histogram.iloc[-1]), 2)
        hist_prev = round(float(histogram.iloc[-2]), 2)
        macd_bullish = macd_val > signal_val
        macd_expanding = abs(hist_val) > abs(hist_prev)

        # ── EMAs ─────────────────────────────────────────────────────────
        ema20 = close.ewm(span=20).mean()
        ema50 = close.ewm(span=50).mean()
        ema200 = close.ewm(span=200).mean() if len(close) >= 200 else ema50
        current_price = float(close.iloc[-1])
        ema20_val = round(float(ema20.iloc[-1]), 2)
        ema50_val = round(float(ema50.iloc[-1]), 2)
        ema200_val = round(float(ema200.iloc[-1]), 2)

        price_above_20 = current_price > ema20_val
        price_above_50 = current_price > ema50_val
        ema20_above_50 = ema20_val > ema50_val
        ema20_rising = float(ema20.iloc[-1]) > float(ema20.iloc[-5])
        ema50_rising = float(ema50.iloc[-1]) > float(ema50.iloc[-5])

        # ── ATR (14) ─────────────────────────────────────────────────────
        tr = pd.concat([
            high - low,
            (high - close.shift()).abs(),
            (low - close.shift()).abs(),
        ], axis=1).max(axis=1)
        atr = tr.rolling(14).mean()
        atr_val = round(float(atr.iloc[-1]), 2)
        atr_pct = round((atr_val / current_price) * 100, 2)

        # ── Bollinger Bands (20, 2) ──────────────────────────────────────
        bb_mid = close.rolling(20).mean()
        bb_std = close.rolling(20).std()
        bb_upper = bb_mid + 2 * bb_std
        bb_lower = bb_mid - 2 * bb_std
        bb_upper_val = float(bb_upper.iloc[-1])
        bb_lower_val = float(bb_lower.iloc[-1])
        bb_width = bb_upper_val - bb_lower_val
        bb_position = (current_price - bb_lower_val) / bb_width if bb_width > 0 else 0.5

        # ── Recent price action ──────────────────────────────────────────
        change_5d = ((current_price / float(close.iloc[-6])) - 1) * 100 if len(close) > 5 else 0
        change_20d = ((current_price / float(close.iloc[-21])) - 1) * 100 if len(close) > 20 else 0

        # ── Trend structure classification ────────────────────────────────
        bullish_signals = 0
        bearish_signals = 0
        total_signals = 7

        if price_above_20: bullish_signals += 1
        else: bearish_signals += 1

        if price_above_50: bullish_signals += 1
        else: bearish_signals += 1

        if ema20_above_50: bullish_signals += 1
        else: bearish_signals += 1

        if ema20_rising: bullish_signals += 1
        else: bearish_signals += 1

        if macd_bullish: bullish_signals += 1
        else: bearish_signals += 1

        if rsi_value > 50: bullish_signals += 1
        else: bearish_signals += 1

        if change_5d > 0: bullish_signals += 1
        else: bearish_signals += 1

        # ── Market structure classification ───────────────────────────────
        if bullish_signals >= 6:
            structure = "Strong Bullish"
        elif bullish_signals >= 5:
            structure = "Moderately Bullish"
        elif bullish_signals == 4:
            if atr_pct > 1.5:
                structure = "Volatile Bullish"
            else:
                structure = "Mildly Bullish"
        elif bullish_signals == 3:
            if atr_pct > 2.0:
                structure = "Volatile Neutral"
            else:
                structure = "Consolidating"
        elif bearish_signals >= 5:
            structure = "Moderately Bearish"
        elif bearish_signals >= 6:
            structure = "Strong Bearish"
        else:
            structure = "Weak Bearish" if bearish_signals > bullish_signals else "Neutral"

        # ── Confidence & stability ────────────────────────────────────────
        trend_confidence = round((max(bullish_signals, bearish_signals) / total_signals) * 100)
        momentum_stable = macd_expanding and (
            (macd_bullish and change_5d > 0) or (not macd_bullish and change_5d < 0)
        )

        if atr_pct < 1.0:
            volatility_regime = "Low"
        elif atr_pct < 1.8:
            volatility_regime = "Normal"
        elif atr_pct < 2.5:
            volatility_regime = "Elevated"
        else:
            volatility_regime = "High"

        # ── AI interpretation ─────────────────────────────────────────────
        explanation = _generate_explanation(
            symbol=symbol,
            structure=structure,
            current_price=current_price,
            rsi_value=rsi_value,
            macd_bullish=macd_bullish,
            macd_expanding=macd_expanding,
            price_above_20=price_above_20,
            price_above_50=price_above_50,
            ema20_rising=ema20_rising,
            ema20_val=ema20_val,
            ema50_val=ema50_val,
            atr_pct=atr_pct,
            bb_position=bb_position,
            change_5d=change_5d,
            change_20d=change_20d,
            volatility_regime=volatility_regime,
        )

        return {
            "symbol": symbol,
            "price": current_price,
            "structure": structure,
            "trendConfidence": trend_confidence,
            "volatilityRegime": volatility_regime,
            "momentumStable": momentum_stable,
            "rsi": {"value": rsi_value, "overbought": rsi_value > 70, "oversold": rsi_value < 30},
            "macd": {"value": macd_val, "signal": signal_val, "histogram": hist_val, "bullish": macd_bullish, "expanding": macd_expanding},
            "ema": {"ema20": ema20_val, "ema50": ema50_val, "ema200": ema200_val, "priceAbove20": price_above_20, "priceAbove50": price_above_50, "aligned": ema20_above_50 and price_above_20},
            "atr": {"value": atr_val, "percent": atr_pct},
            "bollinger": {"position": round(bb_position, 2), "upper": round(bb_upper_val, 2), "lower": round(bb_lower_val, 2)},
            "priceAction": {"change5d": round(change_5d, 2), "change20d": round(change_20d, 2)},
            "explanation": explanation,
        }

    except Exception as e:
        logger.warning("compute_technicals_failed", extra={"extra_fields": {"symbol": symbol, "error": str(e)}})
        return None


def _generate_explanation(
    symbol: str,
    structure: str,
    current_price: float,
    rsi_value: float,
    macd_bullish: bool,
    macd_expanding: bool,
    price_above_20: bool,
    price_above_50: bool,
    ema20_rising: bool,
    ema20_val: float,
    ema50_val: float,
    atr_pct: float,
    bb_position: float,
    change_5d: float,
    change_20d: float,
    volatility_regime: str,
) -> str:
    """Generate a human-readable technical interpretation."""
    parts = []

    # Trend statement
    if "Bullish" in structure:
        parts.append(f"{symbol} is in a {structure.lower()} structure")
        if price_above_20 and price_above_50:
            parts.append(f"trading above both the 20-EMA ({ema20_val:,.0f}) and 50-EMA ({ema50_val:,.0f})")
        elif price_above_20:
            parts.append(f"holding above the 20-EMA ({ema20_val:,.0f}) but below the 50-EMA")
    elif "Bearish" in structure:
        parts.append(f"{symbol} is showing {structure.lower()} characteristics")
        if not price_above_20 and not price_above_50:
            parts.append(f"trading below both the 20-EMA ({ema20_val:,.0f}) and 50-EMA ({ema50_val:,.0f})")
        elif not price_above_50:
            parts.append(f"below the 50-EMA ({ema50_val:,.0f}) which acts as resistance")
    else:
        parts.append(f"{symbol} is in a {structure.lower()} phase with no clear directional bias")

    # Momentum
    if macd_bullish and macd_expanding:
        parts.append("MACD is bullish and expanding — momentum is building")
    elif macd_bullish and not macd_expanding:
        parts.append("MACD is bullish but histogram is contracting — momentum may be fading")
    elif not macd_bullish and macd_expanding:
        parts.append("MACD is bearish and expanding — selling pressure increasing")
    else:
        parts.append("MACD is bearish but contracting — selling pressure may be easing")

    # RSI context
    if rsi_value > 70:
        parts.append(f"RSI at {rsi_value} is in overbought territory — pullback risk elevated")
    elif rsi_value > 60:
        parts.append(f"RSI at {rsi_value} shows healthy bullish momentum")
    elif rsi_value < 30:
        parts.append(f"RSI at {rsi_value} is oversold — bounce potential exists but trend confirmation needed")
    elif rsi_value < 40 and "Bullish" in structure:
        parts.append(f"RSI at {rsi_value} is lagging the trend — watch for momentum confirmation above 50")
    elif rsi_value < 40:
        parts.append(f"RSI at {rsi_value} reflects weak momentum — bears in control")
    else:
        parts.append(f"RSI at {rsi_value} is neutral — no extreme reading")

    # Volatility
    if volatility_regime == "High" or volatility_regime == "Elevated":
        parts.append(f"Volatility is {volatility_regime.lower()} (ATR {atr_pct:.1f}% of price) — expect wider intraday swings")
    elif volatility_regime == "Low":
        parts.append(f"Volatility is compressed (ATR {atr_pct:.1f}%) — a directional expansion may be imminent")

    # Recent action
    if abs(change_5d) > 2:
        direction = "gained" if change_5d > 0 else "lost"
        parts.append(f"Price has {direction} {abs(change_5d):.1f}% over the past 5 sessions")

    return ". ".join(parts) + "."
