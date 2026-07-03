"""
Real financial news service.

Fetches market-relevant news from multiple sources:
- NewsAPI.org (requires free API key)
- Yahoo Finance RSS (no key required, fallback)

Maps news to affected sectors/assets and provides sentiment context.
"""

from __future__ import annotations

import os
import time
from typing import Any
from urllib.request import urlopen, Request
from urllib.error import URLError
import json
import xml.etree.ElementTree as ET

from core.logging_setup import get_logger

logger = get_logger(__name__)

# ─── Cache ─────────────────────────────────────────────────────────────────

_news_cache: list[dict] = []
_news_cache_ts: float = 0
NEWS_CACHE_TTL = 300  # 5 minutes

# ─── Sector mapping keywords ──────────────────────────────────────────────

SECTOR_KEYWORDS = {
    "Banking": ["bank", "rbi", "npa", "credit", "loan", "interest rate", "hdfc", "icici", "sbi", "axis", "kotak"],
    "IT": ["infosys", "tcs", "wipro", "hcl", "tech mahindra", "software", "it sector", "digital"],
    "Pharma": ["pharma", "drug", "fda", "sun pharma", "dr reddy", "cipla", "biocon", "healthcare"],
    "Auto": ["auto", "tata motors", "maruti", "mahindra", "ev", "electric vehicle", "automobile"],
    "Energy": ["oil", "crude", "ongc", "reliance", "petrol", "diesel", "gas", "energy", "opec"],
    "Metals": ["gold", "silver", "copper", "steel", "aluminium", "hindalco", "tata steel", "metal"],
    "FMCG": ["fmcg", "hindustan unilever", "itc", "nestle", "consumer", "retail"],
    "Realty": ["real estate", "realty", "housing", "dlf", "godrej properties"],
}

SENTIMENT_KEYWORDS = {
    "bullish": ["rally", "surge", "gain", "rise", "bullish", "positive", "growth", "recovery", "upgrade", "outperform", "buy"],
    "bearish": ["fall", "drop", "decline", "bearish", "negative", "crash", "downgrade", "sell", "weak", "loss", "concern"],
}


def _detect_sectors(text: str) -> list[str]:
    """Detect affected sectors from news text."""
    text_lower = text.lower()
    sectors = []
    for sector, keywords in SECTOR_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            sectors.append(sector)
    return sectors[:3] if sectors else ["Broad Market"]


def _detect_sentiment(text: str) -> str:
    """Simple keyword-based sentiment detection."""
    text_lower = text.lower()
    bull_score = sum(1 for kw in SENTIMENT_KEYWORDS["bullish"] if kw in text_lower)
    bear_score = sum(1 for kw in SENTIMENT_KEYWORDS["bearish"] if kw in text_lower)
    if bull_score > bear_score:
        return "bullish"
    if bear_score > bull_score:
        return "bearish"
    return "neutral"


# ─── NewsAPI.org ───────────────────────────────────────────────────────────

def _fetch_newsapi() -> list[dict]:
    """Fetch from NewsAPI.org (requires NEWSAPI_KEY env var)."""
    api_key = os.getenv("NEWSAPI_KEY")
    if not api_key:
        return []

    try:
        url = (
            f"https://newsapi.org/v2/everything?"
            f"q=(NIFTY OR BSE OR NSE OR RBI OR \"Indian market\" OR SENSEX)&"
            f"language=en&sortBy=publishedAt&pageSize=10&"
            f"apiKey={api_key}"
        )
        req = Request(url, headers={"User-Agent": "NeuroTrade/1.0"})
        with urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        articles = data.get("articles", [])
        results = []
        for art in articles[:8]:
            title = art.get("title", "")
            desc = art.get("description", "") or ""
            source = art.get("source", {}).get("name", "Unknown")
            published = art.get("publishedAt", "")

            if not title or title == "[Removed]":
                continue

            full_text = f"{title} {desc}"
            results.append({
                "headline": title,
                "description": desc[:200],
                "source": source,
                "publishedAt": published,
                "sentiment": _detect_sentiment(full_text),
                "affectedSectors": _detect_sectors(full_text),
                "impact": "high" if any(kw in full_text.lower() for kw in ["rbi", "fed", "opec", "inflation", "gdp"]) else "medium",
            })

        return results
    except (URLError, json.JSONDecodeError, Exception) as e:
        logger.warning("newsapi_fetch_failed", extra={"extra_fields": {"error": str(e)}})
        return []


# ─── Yahoo Finance RSS (fallback, no API key needed) ───────────────────────

def _fetch_yahoo_rss() -> list[dict]:
    """Fetch from Yahoo Finance India RSS feed."""
    try:
        url = "https://finance.yahoo.com/news/rssindex"
        req = Request(url, headers={"User-Agent": "NeuroTrade/1.0"})
        with urlopen(req, timeout=10) as resp:
            xml_data = resp.read().decode()

        root = ET.fromstring(xml_data)
        items = root.findall(".//item")

        results = []
        for item in items[:8]:
            title = item.findtext("title", "")
            desc = item.findtext("description", "") or ""
            source = "Yahoo Finance"
            pub_date = item.findtext("pubDate", "")

            if not title:
                continue

            full_text = f"{title} {desc}"
            results.append({
                "headline": title,
                "description": desc[:200],
                "source": source,
                "publishedAt": pub_date,
                "sentiment": _detect_sentiment(full_text),
                "affectedSectors": _detect_sectors(full_text),
                "impact": "medium",
            })

        return results
    except Exception as e:
        logger.warning("yahoo_rss_failed", extra={"extra_fields": {"error": str(e)}})
        return []


# ─── Public API ────────────────────────────────────────────────────────────

def fetch_market_news() -> list[dict[str, Any]]:
    """
    Fetch real financial news. Tries NewsAPI first, falls back to Yahoo RSS.
    Results are cached for 5 minutes.
    """
    global _news_cache, _news_cache_ts

    if _news_cache and (time.time() - _news_cache_ts) < NEWS_CACHE_TTL:
        return _news_cache

    # Try NewsAPI first (better quality, requires key)
    news = _fetch_newsapi()

    # Fallback to Yahoo RSS
    if not news:
        news = _fetch_yahoo_rss()

    if news:
        _news_cache = news
        _news_cache_ts = time.time()

    return news
