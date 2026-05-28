/**
 * Shared API contract types.
 *
 * These types mirror the Flask backend response shapes exactly.
 * They serve as the single source of truth for frontend-backend
 * communication. If the backend contract changes, update here first.
 */

// ─── Prediction ───────────────────────────────────────────────────────────

export interface PredictionPoint {
  date: string;
  actual: number;
  predicted: number;
}

export interface ModelMetrics {
  rmse: number;
  normalized_rmse: number;
  mae: number;
  r2: number;
  directional_accuracy: number;
  final_loss?: number;
}

export interface TechnicalAnalysis {
  moving_averages: "Bullish" | "Bearish" | "Unknown";
  volume_trend: "High" | "Low" | "Unknown";
  price_trend: "Upward" | "Downward" | "Unknown";
  error?: string;
}

export interface PredictResponse {
  predictions: Record<string, PredictionPoint[] | null>;
  metrics: Record<string, ModelMetrics | null>;
  technical_analysis: Record<string, TechnicalAnalysis>;
  run_artifacts?: Record<string, string>;
  errors?: Record<string, string>;
  request_id?: string;
}

// ─── Health ───────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
}

// ─── Errors ───────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "network_error"
  | "timeout"
  | "invalid_request"
  | "no_symbols"
  | "too_many_symbols"
  | "invalid_symbol"
  | "no_valid_data"
  | "prediction_failed"
  | "file_not_found"
  | "server_error"
  | "unknown";

export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  details?: unknown;
  request_id?: string;
}

// ─── Run Artifact ─────────────────────────────────────────────────────────

export interface RunArtifact {
  run_id: string;
  symbol: string;
  created_at: string;
  model_version: string;
  schema_version: string;
  hyperparameters: {
    sequence_length: number;
    train_split: number;
    epochs: number;
    batch_size: number;
    dropout: number;
    lstm_units_1: number;
    lstm_units_2: number;
    dense_units: number;
    optimizer: string;
    loss: string;
    learning_rate: number | null;
    early_stopping_patience: number;
    history_days: number;
  };
  metrics: ModelMetrics;
  predictions: PredictionPoint[];
  technical_indicators: TechnicalAnalysis;
  inputs: {
    history_days: number;
    rows_used: number;
    price_column: string;
  };
  timings: Record<string, number>;
}

// ─── Future Types (Phase 2+) ──────────────────────────────────────────────

export interface SentimentData {
  symbol: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  sources: Array<{
    title: string;
    source: string;
    sentiment: string;
    score: number;
  }>;
}

export interface MarketOverview {
  indices: Array<{ name: string; value: number; change: number }>;
  sectors: Array<{ name: string; change: number }>;
  topMovers: Array<{ symbol: string; price: number; change: number }>;
}

export interface WatchlistItem {
  symbol: string;
  lastPrice?: number;
  lastChange?: number;
  lastForecast?: number;
  confidence?: number;
  stance?: "Bullish" | "Bearish";
  updatedAt?: string;
}
