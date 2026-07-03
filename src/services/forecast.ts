/**
 * Universal AI Forecast Service.
 *
 * Connects to the new /forecast/:symbol endpoint backed by the universal
 * forecast engine. Works across indices, equities, and commodities — no
 * LSTM training required, sub-second response.
 *
 * Replaces the old /predict (LSTM) workflow on the Forecast workspace.
 */

const BASE =
  typeof window === "undefined"
    ? (process.env.NEUROTRADE_API_URL ?? "http://127.0.0.1:5001")
    : "/api/backend";

// ─── Types ────────────────────────────────────────────────────────────────

export type AssetType = "index" | "equity" | "commodity";

export interface ForecastTechnicals {
  rsi: { value: number; overbought: boolean; oversold: boolean };
  macd: {
    value: number;
    signal: number;
    histogram: number;
    bullish: boolean;
    expanding: boolean;
  };
  ema: {
    ema20: number;
    ema50: number;
    ema200: number;
    priceAbove20: boolean;
    priceAbove50: boolean;
    aligned: boolean;
  };
  atr: { value: number; percent: number };
  bollinger: { position: number; upper: number; lower: number };
  priceAction: { change5d: number; change20d: number };
}

export interface ProbabilisticOutlook {
  bullish: number;
  bearish: number;
  consolidation: number;
  confidence: number;
  volatilityExpectation: string;
  directionalConfidence: "Strong" | "Moderate" | "Weak";
}

export interface UniversalForecast {
  symbol: string;
  yfSymbol: string;
  displayName: string;
  assetType: AssetType;
  currentPrice: number;
  structure: string;
  trendConfidence: number;
  volatilityRegime: "Low" | "Normal" | "Elevated" | "High";
  momentumStable: boolean;
  technicals: ForecastTechnicals;
  outlook: ProbabilisticOutlook;
  narrative: string;
  keyDrivers: string[];
  relevantThemes: string[];
  request_id?: string;
}

// ─── Error type ───────────────────────────────────────────────────────────

export class ForecastError extends Error {
  code:
    | "asset_unsupported"
    | "no_data"
    | "network_error"
    | "timeout"
    | "server_error"
    | "unknown";
  status?: number;
  symbol?: string;

  constructor(
    message: string,
    code: ForecastError["code"],
    opts?: { status?: number; symbol?: string }
  ) {
    super(message);
    this.name = "ForecastError";
    this.code = code;
    this.status = opts?.status;
    this.symbol = opts?.symbol;
  }

  get displayMessage(): string {
    switch (this.code) {
      case "asset_unsupported":
        return `${this.symbol ?? "This asset"} is not currently supported. Try an Indian index (NIFTY, BANKNIFTY), equity (RELIANCE, HDFCBANK), or commodity (GOLD, COPPER, CRUDE).`;
      case "no_data":
        return `Unable to fetch market data for ${this.symbol ?? "this asset"}. The market may be closed or the symbol may be invalid.`;
      case "network_error":
        return "Unable to reach the intelligence engine. Check your connection.";
      case "timeout":
        return "The forecast request took too long. Please try again.";
      case "server_error":
        return "The intelligence engine encountered an error. Please retry shortly.";
      default:
        return this.message;
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

const TIMEOUT_MS = 30_000;

/**
 * Generate a universal AI forecast for any supported asset.
 * Returns intelligence package with technicals, outlook, narrative, and themes.
 */
export async function fetchUniversalForecast(
  symbol: string
): Promise<UniversalForecast> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      `${BASE}/forecast/${encodeURIComponent(symbol.toUpperCase())}`,
      {
        headers: {
          "Content-Type": "application/json",
          "Bypass-Tunnel-Reminder": "true",
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    let body: any;
    try {
      body = await res.json();
    } catch {
      throw new ForecastError(
        "Invalid response from server",
        "server_error",
        { status: res.status, symbol }
      );
    }

    if (!res.ok) {
      if (res.status === 404) {
        throw new ForecastError(
          body?.error ?? "Asset not supported",
          "asset_unsupported",
          { status: res.status, symbol }
        );
      }
      throw new ForecastError(
        body?.error ?? `Forecast failed (${res.status})`,
        res.status >= 500 ? "server_error" : "no_data",
        { status: res.status, symbol }
      );
    }

    return body as UniversalForecast;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof ForecastError) throw err;
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ForecastError("Request timed out", "timeout", { symbol });
    }
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new ForecastError(
        "Unable to reach intelligence engine",
        "network_error",
        { symbol }
      );
    }
    throw new ForecastError(
      err instanceof Error ? err.message : "Unknown error",
      "unknown",
      { symbol }
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Determine the dominant outlook label from probabilities.
 */
export function dominantOutlook(
  outlook: ProbabilisticOutlook
): "Bullish" | "Bearish" | "Range-Bound" {
  const max = Math.max(outlook.bullish, outlook.bearish, outlook.consolidation);
  if (max === outlook.bullish) return "Bullish";
  if (max === outlook.bearish) return "Bearish";
  return "Range-Bound";
}

/**
 * Get a human-readable label for the asset type.
 */
export function assetTypeLabel(t: AssetType): string {
  if (t === "index") return "Index";
  if (t === "commodity") return "Commodity";
  return "Equity";
}
