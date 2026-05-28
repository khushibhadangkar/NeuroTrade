"""
Universal AI Forecast Engine.

A unified intelligence system that works for indices, equities, and commodities.
Combines technical analysis, volatility regime, momentum, and asset-specific
context into probabilistic outlooks and human-readable narratives.

This replaces the old LSTM-only prediction approach with a faster, broader,
asset-aware intelligence pipeline.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

from core.logging_setup import get_logger
from technicals import compute_technicals
from market_data import INDICES, EQUITIES, COMMODITIES

logger = get_logger(__name__)


# ─── Asset detection ──────────────────────────────────────────────────────


def detect_asset_type(symbol: str) -> tuple[str, str, str]:
    """
    Detect asset type and return (yfinance_symbol, asset_type, display_name).

    Asset types: 'index', 'equity', 'commodity'
    """
    sym = symbol.upper().strip()

    # Index check
    if sym in INDICES:
        names = {"NIFTY": "NIFTY 50", "BANKNIFTY": "BANK NIFTY", "SENSEX": "SENSEX", "FINNIFTY": "FIN NIFTY"}
        return INDICES[sym], "index", names.get(sym, sym)

    # Commodity check
    if sym in COMMODITIES:
        names = {"GOLD": "Gold", "SILVER": "Silver", "CRUDE": "Crude Oil", "NATGAS": "Natural Gas", "COPPER": "Copper"}
        return COMMODITIES[sym], "commodity", names.get(sym, sym)

    # Equity check
    if sym in EQUITIES:
        return EQUITIES[sym], "equity", sym

    # Try as raw yfinance symbol
    if sym.startswith("^") or sym.endswith(".NS") or "=F" in sym:
        if sym.startswith("^"):
            return sym, "index", sym.replace("^", "")
        if sym.endswith(".NS"):
            return sym, "equity", sym.replace(".NS", "")
        return sym, "commodity", sym.replace("=F", "")

    # Default to equity
    return f"{sym}.NS", "equity", sym


# ─── Probabilistic outlook ────────────────────────────────────────────────


def compute_probabilistic_outlook(technicals: dict[str, Any]) -> dict[str, Any]:
    """
    Derive bullish/bearish/consolidation probabilities from technical signals.

    Uses a weighted scoring system rather than simplistic rules:
    - Trend alignment (40% weight)
    - Momentum (25% weight)
    - Volatility (15% weight)
    - Recent action (20% weight)
    """
    # Trend score (0-100, where 50 is neutral)
    trend_score = 50
    if technicals["ema"]["priceAbove20"]: trend_score += 8
    else: trend_score -= 8
    if technicals["ema"]["priceAbove50"]: trend_score += 8
    else: trend_score -= 8
    if technicals["ema"]["aligned"]: trend_score += 10
    else: trend_score -= 5

    # Momentum score
    momentum_score = 50
    if technicals["macd"]["bullish"]: momentum_score += 12
    else: momentum_score -= 12
    if technicals["macd"]["expanding"]:
        if technicals["macd"]["bullish"]: momentum_score += 6
        else: momentum_score -= 6

    # RSI contribution
    rsi = technicals["rsi"]["value"]
    if rsi > 70: momentum_score -= 8  # overbought = pullback risk
    elif rsi > 55: momentum_score += 6
    elif rsi < 30: momentum_score += 8  # oversold = bounce potential
    elif rsi < 45: momentum_score -= 6

    # Recent action score
    action_score = 50
    change_5d = technicals["priceAction"]["change5d"]
    change_20d = technicals["priceAction"]["change20d"]
    action_score += min(max(change_5d * 4, -20), 20)
    action_score += min(max(change_20d * 1.5, -10), 10)

    # Combined weighted score (0-100)
    combined = (
        trend_score * 0.40 +
        momentum_score * 0.25 +
        action_score * 0.35
    )

    # Volatility adjusts consolidation probability
    atr_pct = technicals["atr"]["percent"]
    base_consolidation = max(15, 35 - atr_pct * 5)  # higher vol = less consolidation likely

    # Distribute probabilities
    if combined >= 60:
        bullish = min(70, combined)
        consolidation = base_consolidation
        bearish = max(5, 100 - bullish - consolidation)
    elif combined <= 40:
        bearish = min(70, 100 - combined)
        consolidation = base_consolidation
        bullish = max(5, 100 - bearish - consolidation)
    else:
        # Range-bound bias
        consolidation = min(50, base_consolidation + 15)
        if combined >= 50:
            bullish = (100 - consolidation) * 0.6
            bearish = 100 - consolidation - bullish
        else:
            bearish = (100 - consolidation) * 0.6
            bullish = 100 - consolidation - bearish

    # Normalize
    total = bullish + bearish + consolidation
    bullish = round((bullish / total) * 100)
    bearish = round((bearish / total) * 100)
    consolidation = 100 - bullish - bearish

    # Confidence based on signal alignment
    confidence = technicals["trendConfidence"]
    if not technicals["momentumStable"]: confidence = max(30, confidence - 15)
    if technicals["volatilityRegime"] == "High": confidence = max(30, confidence - 10)

    # Volatility expectation
    vol_expectation = technicals["volatilityRegime"]
    if technicals["bollinger"]["position"] > 0.85 or technicals["bollinger"]["position"] < 0.15:
        vol_expectation = "Expanding"

    return {
        "bullish": bullish,
        "bearish": bearish,
        "consolidation": consolidation,
        "confidence": confidence,
        "volatilityExpectation": vol_expectation,
        "directionalConfidence": "Strong" if confidence >= 70 else "Moderate" if confidence >= 50 else "Weak",
    }


# ─── Asset-specific narrative generators ──────────────────────────────────


def _index_narrative(name: str, technicals: dict, outlook: dict) -> str:
    """Generate narrative for indices (NIFTY, BANKNIFTY, etc.)."""
    structure = technicals["structure"]
    rsi = technicals["rsi"]["value"]
    change_5d = technicals["priceAction"]["change5d"]
    vol = technicals["volatilityRegime"]

    parts = [f"{name} is currently in a {structure.lower()} structure"]

    if "Bullish" in structure:
        parts.append(f"with banking and financial sector flows likely to remain key drivers")
        if vol == "Low" or vol == "Normal":
            parts.append(f"Low volatility regime supports continued trend extension if {name} holds above the 20-EMA at {technicals['ema']['ema20']:,.0f}")
        else:
            parts.append(f"Elevated volatility means traders should expect wider swings — risk management is critical")
    elif "Bearish" in structure:
        parts.append(f"with weakness across most indicators")
        parts.append(f"Watch for capitulation signals or a base formation near the 50-EMA at {technicals['ema']['ema50']:,.0f}")
    else:
        parts.append(f"with mixed signals across timeframes")
        parts.append(f"Range-bound conditions favor mean-reversion strategies until a clear breakout above {technicals['bollinger']['upper']:,.0f} or breakdown below {technicals['bollinger']['lower']:,.0f}")

    # Probabilistic context
    if outlook["bullish"] > 55:
        parts.append(f"Probabilistic outlook leans bullish ({outlook['bullish']}%) but {outlook['directionalConfidence'].lower()} confidence suggests waiting for confirmation")
    elif outlook["bearish"] > 55:
        parts.append(f"Probabilistic outlook tilts bearish ({outlook['bearish']}%) — defensive positioning may be prudent")
    else:
        parts.append(f"With consolidation probability at {outlook['consolidation']}%, expect range-bound action in the near term")

    return ". ".join(parts) + "."


def _equity_narrative(name: str, technicals: dict, outlook: dict) -> str:
    """Generate narrative for individual equities."""
    structure = technicals["structure"]
    rsi = technicals["rsi"]["value"]
    change_20d = technicals["priceAction"]["change20d"]
    macd = technicals["macd"]

    parts = [f"{name} is showing a {structure.lower()} technical structure"]

    if "Bullish" in structure:
        parts.append(f"with price holding above key moving averages")
        if change_20d > 5:
            parts.append(f"The {change_20d:.1f}% gain over 20 sessions reflects sustained institutional interest")
        if macd["bullish"] and macd["expanding"]:
            parts.append(f"Expanding MACD histogram confirms strengthening momentum")
    elif "Bearish" in structure:
        parts.append(f"with multiple indicators flashing weakness")
        if change_20d < -5:
            parts.append(f"The {abs(change_20d):.1f}% decline over 20 sessions suggests distribution by larger players")
    else:
        parts.append(f"in a consolidation phase awaiting a directional catalyst")

    if rsi > 70:
        parts.append(f"RSI at {rsi:.0f} signals overbought conditions — a 3-5% pullback would offer better risk-reward")
    elif rsi < 30:
        parts.append(f"RSI at {rsi:.0f} indicates oversold conditions — bounce potential exists if support holds")

    parts.append(f"Outlook probabilities: {outlook['bullish']}% bullish, {outlook['consolidation']}% range-bound, {outlook['bearish']}% bearish")

    return ". ".join(parts) + "."


def _commodity_narrative(name: str, technicals: dict, outlook: dict) -> str:
    """Generate narrative for commodities — incorporates macro context."""
    structure = technicals["structure"]
    macro_context = {
        "Gold": "central bank buying, geopolitical uncertainty, and US real yields",
        "Silver": "industrial demand from solar/electronics and gold-silver ratio dynamics",
        "Crude Oil": "OPEC+ production discipline, China demand recovery, and US inventory data",
        "Natural Gas": "weather patterns, LNG export capacity, and storage levels",
        "Copper": "Chinese manufacturing PMI, supply disruptions in Chile, and global growth outlook",
    }

    india_impact = {
        "Gold": "Higher prices benefit jewellery makers like Titan; impact gold loan companies",
        "Silver": "Industrial demand recovery is positive for Hindustan Zinc and silver-linked plays",
        "Crude Oil": "Lower prices reduce India's import bill — positive for OMCs, airlines, paint companies",
        "Natural Gas": "Higher gas prices increase costs for fertilizer and city gas distribution companies",
        "Copper": "Stable prices supportive for Hindalco; breakout signals industrial demand recovery",
    }

    parts = [f"{name} is in a {structure.lower()} regime"]

    macro = macro_context.get(name, "global macro factors")
    parts.append(f"with key drivers being {macro}")

    if "Bullish" in structure:
        parts.append(f"Technical structure supports continued upside, though {name.lower()} remains sensitive to dollar movements and risk sentiment")
    elif "Bearish" in structure:
        parts.append(f"Technical weakness combined with macro headwinds suggests further downside risk")
    else:
        parts.append(f"Range-bound action reflects balanced fundamental forces — wait for a breakout for directional bias")

    impact = india_impact.get(name)
    if impact:
        parts.append(f"India market impact: {impact}")

    parts.append(f"Volatility regime is {technicals['volatilityRegime'].lower()} (ATR {technicals['atr']['percent']:.1f}% of price)")
    parts.append(f"Probabilistic outlook: {outlook['bullish']}% bullish, {outlook['consolidation']}% range-bound, {outlook['bearish']}% bearish")

    return ". ".join(parts) + "."


# ─── Asset-specific context ───────────────────────────────────────────────


def _get_key_drivers(asset_type: str, name: str) -> list[str]:
    """Return key macro/structural drivers for the asset type."""
    if asset_type == "index":
        return ["FII/DII flows", "RBI policy stance", "Sector rotation", "Global cues", "Earnings momentum"]
    if asset_type == "commodity":
        drivers_map = {
            "Gold": ["US real yields", "Dollar index", "Central bank demand", "Geopolitical risk"],
            "Silver": ["Industrial demand", "Gold-silver ratio", "Solar/EV adoption", "Supply constraints"],
            "Crude Oil": ["OPEC+ policy", "China demand", "US inventories", "Geopolitical events"],
            "Natural Gas": ["Weather patterns", "Storage levels", "LNG exports", "Asian demand"],
            "Copper": ["China PMI", "Supply disruptions", "Global growth", "Energy transition demand"],
        }
        return drivers_map.get(name, ["Global macro", "Dollar dynamics", "Industrial demand"])
    return ["Sector dynamics", "Earnings momentum", "Institutional flows", "Index inclusion"]


def _get_relevant_themes(asset_type: str, name: str) -> list[str]:
    """Return news/macro themes relevant to this asset."""
    if asset_type == "index":
        return ["RBI commentary", "FII flows", "Q4 earnings", "Global market cues", "Sector rotation"]
    if asset_type == "commodity":
        themes_map = {
            "Gold": ["Fed policy outlook", "Geopolitical tensions", "Central bank purchases", "Dollar weakness"],
            "Silver": ["Solar installation data", "EV demand", "Industrial PMI", "Gold-silver ratio"],
            "Crude Oil": ["OPEC+ meeting", "China demand recovery", "US inventory data", "Middle East tensions"],
            "Natural Gas": ["US weather forecasts", "Storage reports", "European LNG demand", "Asian buying"],
            "Copper": ["China stimulus", "Chile supply news", "EV adoption rate", "Global growth indicators"],
        }
        return themes_map.get(name, ["Macroeconomic data", "Global demand", "Currency moves"])
    return ["Q4 results", "Sector news", "Management commentary", "Peer performance"]


# ─── Main forecast generator ──────────────────────────────────────────────


def generate_forecast(symbol: str) -> dict[str, Any] | None:
    """
    Generate a complete AI forecast for any asset type.

    Returns a unified intelligence package with:
    - Asset metadata
    - Real-time price data
    - Technical analysis
    - Probabilistic outlook
    - AI narrative
    - Key drivers and themes
    """
    yf_symbol, asset_type, display_name = detect_asset_type(symbol)

    technicals = compute_technicals(yf_symbol)
    if technicals is None:
        return None

    outlook = compute_probabilistic_outlook(technicals)

    # Generate appropriate narrative
    if asset_type == "index":
        narrative = _index_narrative(display_name, technicals, outlook)
    elif asset_type == "commodity":
        narrative = _commodity_narrative(display_name, technicals, outlook)
    else:
        narrative = _equity_narrative(display_name, technicals, outlook)

    return {
        "symbol": symbol.upper(),
        "yfSymbol": yf_symbol,
        "displayName": display_name,
        "assetType": asset_type,
        "currentPrice": technicals["price"],
        "structure": technicals["structure"],
        "trendConfidence": technicals["trendConfidence"],
        "volatilityRegime": technicals["volatilityRegime"],
        "momentumStable": technicals["momentumStable"],
        "technicals": {
            "rsi": technicals["rsi"],
            "macd": technicals["macd"],
            "ema": technicals["ema"],
            "atr": technicals["atr"],
            "bollinger": technicals["bollinger"],
            "priceAction": technicals["priceAction"],
        },
        "outlook": outlook,
        "narrative": narrative,
        "keyDrivers": _get_key_drivers(asset_type, display_name),
        "relevantThemes": _get_relevant_themes(asset_type, display_name),
    }
