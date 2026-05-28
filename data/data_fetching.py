"""yfinance-backed market data acquisition.

The shape of the returned tuple ``(df, company_list, valid_symbols)`` is
preserved exactly to keep the existing API and CLI consumers working.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Iterable, List, Tuple

import pandas as pd
import yfinance as yf

from core.config import get_model_config
from core.logging_setup import get_logger

logger = get_logger(__name__)


def get_stock_data(
    tech_list: Iterable[str],
    *,
    history_days: int | None = None,
    min_rows: int | None = None,
) -> Tuple[pd.DataFrame, List[pd.DataFrame], List[str]]:
    """Download OHLC frames for each ticker.

    Returns
    -------
    df:
        Concatenated MultiIndex DataFrame containing every successfully
        downloaded ticker.
    company_list:
        Per-ticker DataFrames in the same order as the symbols arrived.
    valid_symbols:
        Tickers that produced usable data.
    """
    config = get_model_config()
    history_days = history_days or config.history_days
    min_rows = min_rows or config.sequence_length

    end = datetime.now()
    start = end - timedelta(days=history_days)

    company_list: List[pd.DataFrame] = []
    failed_downloads: List[Tuple[str, str]] = []

    for symbol in tech_list:
        try:
            logger.info(
                "fetch_symbol_start",
                extra={"extra_fields": {"symbol": symbol, "start": str(start.date()), "end": str(end.date())}},
            )
            stock_data = yf.download(symbol, start=start, end=end, progress=False)

            if stock_data is None or stock_data.empty:
                failed_downloads.append((symbol, "No data found"))
                continue

            if "Adj Close" not in stock_data.columns and "Close" not in stock_data.columns:
                failed_downloads.append((symbol, "No price data available"))
                continue

            if len(stock_data) < min_rows:
                failed_downloads.append(
                    (symbol, f"Insufficient historical data ({len(stock_data)} < {min_rows})")
                )
                continue

            if stock_data.isna().any().any():
                # Modern pandas: prefer .ffill()/.bfill() over fillna(method=...)
                stock_data = stock_data.ffill().bfill()
                if stock_data.isna().any().any():
                    failed_downloads.append((symbol, "Contains missing values"))
                    continue

            stock_data["company_name"] = symbol
            company_list.append(stock_data)
            logger.info(
                "fetch_symbol_complete",
                extra={"extra_fields": {"symbol": symbol, "rows": len(stock_data)}},
            )

        except Exception as exc:  # noqa: BLE001
            failed_downloads.append((symbol, str(exc)))
            logger.warning(
                "fetch_symbol_failed",
                extra={"extra_fields": {"symbol": symbol, "error": str(exc)}},
            )

    if not company_list:
        raise ValueError("No valid stock data was downloaded. Please check the stock symbols.")

    df = pd.concat(
        company_list,
        keys=[data["company_name"].iloc[0] for data in company_list],
    )

    if failed_downloads:
        logger.warning(
            "fetch_summary_failures",
            extra={"extra_fields": {"failures": failed_downloads}},
        )

    valid_symbols = [data["company_name"].iloc[0] for data in company_list]
    logger.info(
        "fetch_summary_success",
        extra={"extra_fields": {"valid_symbols": valid_symbols, "count": len(valid_symbols)}},
    )

    return df, company_list, valid_symbols
