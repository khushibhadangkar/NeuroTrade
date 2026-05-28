"""CLI entry point for running the full prediction pipeline locally.

Restored to working state: previously imported ``generate_report`` and
``generate_final_report``, which had been deleted during a prior
refactor. Both functions are now provided again by
``model_training.model_training_and_prediction`` (the facade module).
"""

from __future__ import annotations

import os
import sys
import time

import matplotlib

matplotlib.use("Agg")  # safe before pyplot import; avoids GUI requirement on headless CI
import matplotlib.pyplot as plt  # noqa: E402  (matplotlib.use must precede this)

# Add repository root to sys.path so absolute imports work whether the
# script is launched as ``python scripts/main.py`` or as a module.
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from core.logging_setup import configure_logging, get_logger, log_context  # noqa: E402
from data.data_fetching import get_stock_data  # noqa: E402
from model_training.model_training_and_prediction import (  # noqa: E402
    generate_final_report,
    generate_report,
    predict_stock_price,
)
from utils.data_analysis_and_visualization import (  # noqa: E402
    main_analysis,
    plot_correlation_analysis,
)
from utils.risk_analysis import analyze_risk  # noqa: E402

logger = get_logger(__name__)


def get_valid_stock_symbols() -> list[str]:
    """Prompt the user for a whitespace-separated list of tickers."""
    while True:
        raw = input("Enter the stock symbols (separated by spaces): ").strip()
        if not raw:
            print("Error: please enter at least one stock symbol.")
            continue
        symbols = [token.strip().upper() for token in raw.split() if token.strip()]
        if not symbols:
            print("Error: please enter valid stock symbols.")
            continue
        return symbols


def main() -> None:
    """Run market analysis, prediction, and report generation for user-supplied tickers."""
    configure_logging(json_output=False)  # human-readable output for CLI use

    start_time = time.time()
    tech_list = get_valid_stock_symbols()

    with log_context(symbols=tech_list):
        logger.info("cli_run_start")

        df, company_list, _ = get_stock_data(tech_list)
        main_analysis(company_list, tech_list)

        tech_rets = plot_correlation_analysis(tech_list)
        if not tech_rets.empty:
            analyze_risk(tech_rets)

        all_metrics: dict[str, dict] = {}
        for symbol in tech_list:
            try:
                predictions, metrics = predict_stock_price(symbol)
                generate_report(symbol, predictions, metrics)
                all_metrics[symbol] = metrics
            except Exception as exc:  # noqa: BLE001
                logger.exception(
                    "cli_symbol_failed",
                    extra={"extra_fields": {"symbol": symbol, "error": str(exc)}},
                )
                all_metrics[symbol] = {}

        generate_final_report(all_metrics)

        duration = time.time() - start_time
        logger.info("cli_run_complete", extra={"extra_fields": {"duration_s": round(duration, 2)}})

    print("\nReports generated under the 'results/' directory.")
    print("Per-symbol artifacts: {SYMBOL}_prediction_report.txt, {SYMBOL}_prediction_plot.png")
    print("Aggregate report: results/final_model_report.txt")
    print("Structured run artifacts: results/runs/{run_id}.json (and {SYMBOL}_latest.json)")

    plt.close("all")


if __name__ == "__main__":
    main()
