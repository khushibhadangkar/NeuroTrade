"""Risk-vs-return scatter analysis."""

from __future__ import annotations

import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

from core.config import get_app_config
from core.logging_setup import get_logger

logger = get_logger(__name__)


def analyze_risk(tech_rets: pd.DataFrame) -> pd.DataFrame:
    """Plot expected return vs standard deviation and return per-symbol stats.

    Previously called ``plt.show()`` directly, which blocks in CLI use
    and fails in headless contexts. Now writes ``results/risk_analysis.png``
    and returns the per-symbol mean/std DataFrame for programmatic use.
    """
    if tech_rets is None or tech_rets.empty:
        logger.info("risk_analysis_skipped", extra={"extra_fields": {"reason": "empty input"}})
        return pd.DataFrame()

    rets = tech_rets.dropna()
    summary = pd.DataFrame({"expected_return": rets.mean(), "risk": rets.std()})

    area = np.pi * 20
    plt.figure(figsize=(10, 8))
    plt.scatter(summary["expected_return"], summary["risk"], s=area)
    plt.xlabel("Expected return")
    plt.ylabel("Risk")

    for label, x, y in zip(summary.index, summary["expected_return"], summary["risk"]):
        plt.annotate(
            label,
            xy=(x, y),
            xytext=(50, 50),
            textcoords="offset points",
            ha="right",
            va="bottom",
            arrowprops=dict(arrowstyle="-", color="blue", connectionstyle="arc3,rad=-0.3"),
        )

    results_dir = get_app_config().results_dir
    results_dir.mkdir(parents=True, exist_ok=True)
    output = results_dir / "risk_analysis.png"
    plt.savefig(output)
    plt.close()

    logger.info("risk_analysis_saved", extra={"extra_fields": {"path": str(output)}})
    return summary
