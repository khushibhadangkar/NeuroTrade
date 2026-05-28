"""Visualization helpers used by the analysis dashboard.

All output paths are resolved through :mod:`core.config` so the same code
behaves identically whether it's invoked from the CLI, the Flask app, or
a future FastAPI gateway.
"""

from __future__ import annotations

import math
from datetime import datetime
from pathlib import Path
from typing import Iterable, List

import matplotlib.pyplot as plt
import pandas as pd
import seaborn as sns
import yfinance as yf

from core.config import get_app_config
from core.logging_setup import get_logger

logger = get_logger(__name__)

# Optional candlestick support
try:
    import mplfinance as mpf  # type: ignore

    MPLFINANCE_AVAILABLE = True
except ImportError:
    MPLFINANCE_AVAILABLE = False


def _results_dir() -> Path:
    results_dir = get_app_config().results_dir
    results_dir.mkdir(parents=True, exist_ok=True)
    return results_dir


def create_subplot_layout(n: int) -> tuple[int, int]:
    """Return ``(rows, cols)`` for a grid that fits ``n`` subplots."""
    if n <= 1:
        return 1, 1
    if n <= 2:
        return 1, 2
    cols = math.ceil(math.sqrt(n))
    rows = math.ceil(n / cols)
    return rows, cols


def plot_closing_prices(company_list: List[pd.DataFrame], tech_list: Iterable[str]) -> None:
    """Plot historical close-price series for every supplied company."""
    if not company_list:
        logger.info("plot_closing_prices_skipped")
        return

    rows, cols = create_subplot_layout(len(company_list))
    plt.figure(figsize=(15, 10))

    for i, company in enumerate(company_list, 1):
        plt.subplot(rows, cols, i)
        # Handle both old (Adj Close) and new (Close) yfinance column names
        price_col = "Adj Close" if "Adj Close" in company.columns else "Close"
        company[price_col].plot()
        plt.ylabel("Close")
        plt.xlabel(None)
        plt.title(f"Closing Price of {company['company_name'].iloc[0]}")

    plt.tight_layout()
    plt.savefig(_results_dir() / "closing_prices.png")
    plt.close()


def plot_volume(company_list: List[pd.DataFrame], tech_list: Iterable[str]) -> None:
    """Plot trading volume for every supplied company."""
    if not company_list:
        logger.info("plot_volume_skipped")
        return

    rows, cols = create_subplot_layout(len(company_list))
    plt.figure(figsize=(15, 10))

    for i, company in enumerate(company_list, 1):
        plt.subplot(rows, cols, i)
        company["Volume"].plot()
        plt.ylabel("Volume")
        plt.xlabel(None)
        plt.title(f"Sales Volume for {company['company_name'].iloc[0]}")

    plt.tight_layout()
    plt.savefig(_results_dir() / "volume.png")
    plt.close()


def calculate_moving_average(company_list: List[pd.DataFrame]) -> None:
    """Compute and plot 10/20/50-day rolling means for every company."""
    if not company_list:
        logger.info("moving_average_skipped")
        return

    ma_days = [10, 20, 50]
    for company in company_list:
        price_col = "Adj Close" if "Adj Close" in company.columns else "Close"
        for ma in ma_days:
            company[f"MA for {ma} days"] = company[price_col].rolling(ma).mean()

    rows, cols = create_subplot_layout(len(company_list))
    fig = plt.figure(figsize=(15, 10))

    for i, company in enumerate(company_list, 1):
        ax = fig.add_subplot(rows, cols, i)
        price_col = "Adj Close" if "Adj Close" in company.columns else "Close"
        company[[price_col, "MA for 10 days", "MA for 20 days", "MA for 50 days"]].plot(ax=ax)
        ax.set_title(company["company_name"].iloc[0])

    plt.tight_layout()
    plt.savefig(_results_dir() / "moving_averages.png")
    plt.close()


def analyze_daily_returns(company_list: List[pd.DataFrame]) -> None:
    """Compute and plot the histogram of daily percent changes."""
    if not company_list:
        logger.info("daily_returns_skipped")
        return

    for company in company_list:
        price_col = "Adj Close" if "Adj Close" in company.columns else "Close"
        company["Daily Return"] = company[price_col].pct_change()

    rows, cols = create_subplot_layout(len(company_list))
    fig = plt.figure(figsize=(15, 10))

    for i, company in enumerate(company_list, 1):
        ax = fig.add_subplot(rows, cols, i)
        company["Daily Return"].hist(bins=50, ax=ax)
        ax.set_title(f"Daily Returns for {company['company_name'].iloc[0]}")

    plt.tight_layout()
    plt.savefig(_results_dir() / "daily_returns.png")
    plt.close()


def plot_correlation_analysis(tech_list: Iterable[str]) -> pd.DataFrame:
    """Render the price/return correlation heatmaps and return the daily returns frame."""
    tech_list = list(tech_list)
    if len(tech_list) < 2:
        logger.info("correlation_skipped", extra={"extra_fields": {"reason": "need >= 2 tickers"}})
        return pd.DataFrame()

    try:
        closing_df = yf.download(
            tech_list,
            start=datetime.now() - pd.DateOffset(years=1),
            end=datetime.now(),
            progress=False,
        )
        # Handle both old and new yfinance column formats
        if "Adj Close" in closing_df.columns:
            closing_df = closing_df["Adj Close"]
        elif "Close" in closing_df.columns:
            closing_df = closing_df["Close"]
        else:
            # Flat columns — already a price frame
            pass

        tech_rets = closing_df.pct_change()

        fig, axes = plt.subplots(1, 2, figsize=(15, 7))
        sns.heatmap(tech_rets.corr(), annot=True, cmap="summer", ax=axes[0])
        axes[0].set_title("Correlation of Stock Returns")
        sns.heatmap(closing_df.corr(), annot=True, cmap="summer", ax=axes[1])
        axes[1].set_title("Correlation of Stock Prices")

        plt.tight_layout()
        plt.savefig(_results_dir() / "correlation_analysis.png")
        plt.close()

        return tech_rets

    except Exception as exc:  # noqa: BLE001
        logger.warning("correlation_failed", extra={"extra_fields": {"error": str(exc)}})
        return pd.DataFrame()


def plot_candlestick_charts(company_list: List[pd.DataFrame], tech_list: Iterable[str]) -> None:
    """Render per-symbol candlestick charts when ``mplfinance`` is available."""
    if not MPLFINANCE_AVAILABLE:
        logger.info("candlestick_skipped", extra={"extra_fields": {"reason": "mplfinance not installed"}})
        return
    if not company_list:
        logger.info("candlestick_skipped", extra={"extra_fields": {"reason": "no data"}})
        return

    for company in company_list:
        try:
            symbol = company["company_name"].iloc[0]
            filename = _results_dir() / f"candlestick_{symbol}.png"
            mpf.plot(company, type="candle", title=f"Candlestick Chart for {symbol}", savefig=str(filename))
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "candlestick_failed",
                extra={"extra_fields": {"symbol": company["company_name"].iloc[0], "error": str(exc)}},
            )


def main_analysis(company_list: List[pd.DataFrame], tech_list: Iterable[str]) -> pd.DataFrame:
    """Run the full visualization pipeline. Returns the daily returns frame."""
    try:
        logger.info("analysis_pipeline_start")
        plot_closing_prices(company_list, tech_list)
        plot_volume(company_list, tech_list)
        calculate_moving_average(company_list)
        analyze_daily_returns(company_list)
        tech_rets = plot_correlation_analysis(tech_list)
        plot_candlestick_charts(company_list, tech_list)
        logger.info("analysis_pipeline_complete")
        return tech_rets
    except Exception as exc:  # noqa: BLE001
        logger.exception("analysis_pipeline_failed", extra={"extra_fields": {"error": str(exc)}})
        return pd.DataFrame()
