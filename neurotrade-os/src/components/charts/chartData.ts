/**
 * Chart data generation — produces realistic OHLC candles, moving averages,
 * RSI, MACD, and AI prediction trails for the ProChart component.
 */

export interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isPrediction: boolean;
}

export interface PredictionPoint {
  date: string;
  value: number;
  upper: number;
  lower: number;
}

export interface RSIPoint {
  date: string;
  value: number;
}

export interface MACDPoint {
  date: string;
  macd: number;
  signal: number;
  histogram: number;
}

export interface MAPoint {
  date: string;
  ma20: number;
  ma50: number;
}

export interface ChartData {
  candles: CandleData[];
  prediction: PredictionPoint[];
  rsi: RSIPoint[];
  macd: MACDPoint[];
  ma: MAPoint[];
  confidence: number;
  stance: "Bullish" | "Bearish";
}

function randomWalk(start: number, steps: number, volatility: number): number[] {
  const values = [start];
  for (let i = 1; i < steps; i++) {
    const drift = (Math.random() - 0.48) * volatility;
    values.push(values[i - 1] + drift);
  }
  return values;
}

function computeRSI(closes: number[], period = 14): number[] {
  const rsi: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      rsi.push(50);
      continue;
    }
    let gains = 0;
    let losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = closes[j] - closes[j - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period || 0.001;
    const rs = avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

function computeEMA(values: number[], period: number): number[] {
  const ema: number[] = [];
  const k = 2 / (period + 1);
  ema[0] = values[0];
  for (let i = 1; i < values.length; i++) {
    ema[i] = values[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}

function computeMA(values: number[], period: number): number[] {
  const ma: number[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      ma.push(values[i]);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    ma.push(sum / period);
  }
  return ma;
}

function getDateLabel(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const TIMEFRAME_DAYS: Record<string, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

export function generateMarketData(timeframe: string): ChartData {
  const totalDays = TIMEFRAME_DAYS[timeframe] ?? 90;
  const predictionDays = Math.max(5, Math.floor(totalDays * 0.15));
  const historicalDays = totalDays - predictionDays;

  // Generate price series
  const basePrice = 180 + Math.random() * 20;
  const volatility = timeframe === "1D" ? 1.5 : timeframe === "1W" ? 2 : 3;
  const closes = randomWalk(basePrice, totalDays, volatility);

  // Generate candles
  const candles: CandleData[] = [];
  for (let i = 0; i < totalDays; i++) {
    const close = closes[i];
    const open = i === 0 ? close - (Math.random() - 0.5) * 2 : closes[i - 1];
    const range = Math.random() * volatility * 1.5;
    const high = Math.max(open, close) + Math.random() * range;
    const low = Math.min(open, close) - Math.random() * range;

    candles.push({
      date: getDateLabel(totalDays - i),
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: Math.floor(Math.random() * 80 + 20) * 1000000,
      isPrediction: i >= historicalDays,
    });
  }

  // AI prediction trail with confidence bands
  const prediction: PredictionPoint[] = [];
  const lastHistorical = closes[historicalDays - 1];
  const predCloses = randomWalk(lastHistorical, predictionDays + 1, volatility * 0.8);
  for (let i = 0; i <= predictionDays; i++) {
    const spread = (i / predictionDays) * volatility * 3;
    prediction.push({
      date: getDateLabel(predictionDays - i),
      value: Math.round(predCloses[i] * 100) / 100,
      upper: Math.round((predCloses[i] + spread) * 100) / 100,
      lower: Math.round((predCloses[i] - spread) * 100) / 100,
    });
  }

  // RSI
  const rsi: RSIPoint[] = computeRSI(closes).map((v, i) => ({
    date: candles[i]?.date ?? "",
    value: Math.round(v * 100) / 100,
  }));

  // MACD
  const ema12 = computeEMA(closes, 12);
  const ema26 = computeEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = computeEMA(macdLine, 9);
  const macd: MACDPoint[] = macdLine.map((v, i) => ({
    date: candles[i]?.date ?? "",
    macd: Math.round(v * 100) / 100,
    signal: Math.round(signalLine[i] * 100) / 100,
    histogram: Math.round((v - signalLine[i]) * 100) / 100,
  }));

  // Moving averages
  const ma20 = computeMA(closes, 20);
  const ma50 = computeMA(closes, Math.min(50, totalDays));
  const ma: MAPoint[] = closes.map((_, i) => ({
    date: candles[i]?.date ?? "",
    ma20: Math.round(ma20[i] * 100) / 100,
    ma50: Math.round(ma50[i] * 100) / 100,
  }));

  // Confidence and stance
  const lastPred = predCloses[predCloses.length - 1];
  const stance = lastPred > lastHistorical ? "Bullish" : "Bearish";
  const confidence = Math.floor(50 + Math.random() * 30);

  return { candles, prediction, rsi, macd, ma, confidence, stance };
}
