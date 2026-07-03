/**
 * NeuroTrade OS — Centralized API Service Layer
 *
 * Production-grade service architecture for communicating with the
 * Flask prediction backend. All API calls flow through this module.
 *
 * Architecture:
 * - Single `ApiClient` class with configurable base URL
 * - Type-safe request/response contracts
 * - Automatic retry with exponential backoff
 * - Request timeout handling
 * - Structured error types for elegant UI error states
 * - Future-ready for WebSocket, SSE, and additional endpoints
 */

import type { ModelMetrics, PredictionPoint, TechnicalAnalysis } from "@/lib/finance";

// ─── Configuration ────────────────────────────────────────────────────────

const API_CONFIG = {
  /** Base URL — uses Next.js rewrite proxy in browser, direct URL on server */
  baseUrl:
    typeof window === "undefined"
      ? (process.env.NEUROTRADE_API_URL ?? "http://127.0.0.1:5001")
      : (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5001"),
  /** Request timeout in ms */
  timeout: 120_000, // 2 min — LSTM training is slow
  /** Max retry attempts for transient failures */
  maxRetries: 2,
  /** Base delay between retries in ms */
  retryDelay: 1000,
  /** Bypass tunnel warning for local dev tunnels */
  bypassHeader: "true",
} as const;

// ─── Error Types ──────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "network_error"
  | "timeout"
  | "invalid_request"
  | "no_symbols"
  | "invalid_symbol"
  | "no_valid_data"
  | "prediction_failed"
  | "server_error"
  | "unknown";

export class ApiServiceError extends Error {
  code: ApiErrorCode;
  status?: number;
  details?: unknown;
  requestId?: string;

  constructor(
    message: string,
    code: ApiErrorCode,
    opts?: { status?: number; details?: unknown; requestId?: string }
  ) {
    super(message);
    this.name = "ApiServiceError";
    this.code = code;
    this.status = opts?.status;
    this.details = opts?.details;
    this.requestId = opts?.requestId;
  }

  /** User-friendly message for display in the UI */
  get displayMessage(): string {
    switch (this.code) {
      case "network_error":
        return "Unable to reach the prediction server. Please check your connection.";
      case "timeout":
        return "The prediction is taking longer than expected. The model may be training — try again shortly.";
      case "invalid_symbol":
        return "One or more ticker symbols are invalid. Please check and try again.";
      case "no_valid_data":
        return "No market data available for the requested symbols. They may be delisted or misspelled.";
      case "prediction_failed":
        return "The AI model was unable to generate a forecast. This can happen with very new or illiquid tickers.";
      case "server_error":
        return "The prediction server encountered an internal error. Our team has been notified.";
      default:
        return this.message;
    }
  }
}

// ─── Response Types ───────────────────────────────────────────────────────

export interface PredictResponse {
  predictions: Record<string, PredictionPoint[] | null>;
  metrics: Record<string, ModelMetrics | null>;
  technical_analysis: Record<string, TechnicalAnalysis & { error?: string }>;
  run_artifacts?: Record<string, string>;
  errors?: Record<string, string>;
  request_id?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

// Future endpoint response types
export interface SentimentResponse {
  symbol: string;
  sentiment: "positive" | "negative" | "neutral";
  score: number;
  sources: Array<{ title: string; source: string; score: number }>;
}

export interface MarketOverviewResponse {
  indices: Array<{ name: string; value: number; change: number }>;
  sectors: Array<{ name: string; change: number }>;
  topMovers: Array<{ symbol: string; price: number; change: number }>;
}

// ─── API Client ───────────────────────────────────────────────────────────

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;

  constructor(config = API_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
    this.maxRetries = config.maxRetries;
    this.retryDelay = config.retryDelay;
  }

  /**
   * Core fetch wrapper with timeout, retry, and error normalization.
   */
  private async request<T>(
    path: string,
    init?: RequestInit,
    retryCount = 0
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Bypass-Tunnel-Reminder": "true",
          ...init?.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new ApiServiceError(
          "Invalid response from server",
          "server_error",
          { status: res.status }
        );
      }

      // Handle HTTP errors
      if (!res.ok) {
        const code = this.mapErrorCode(data?.code, res.status);
        throw new ApiServiceError(
          data?.error ?? `Request failed with status ${res.status}`,
          code,
          {
            status: res.status,
            details: data?.details,
            requestId: data?.request_id,
          }
        );
      }

      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      // Already an ApiServiceError — rethrow
      if (error instanceof ApiServiceError) {
        // Retry on server errors
        if (error.status && error.status >= 500 && retryCount < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.request<T>(path, init, retryCount + 1);
        }
        throw error;
      }

      // AbortError = timeout
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiServiceError(
          "Request timed out",
          "timeout"
        );
      }

      // Network error (fetch failed entirely)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        if (retryCount < this.maxRetries) {
          await this.delay(this.retryDelay * Math.pow(2, retryCount));
          return this.request<T>(path, init, retryCount + 1);
        }
        throw new ApiServiceError(
          "Network connection failed",
          "network_error"
        );
      }

      // Unknown error
      throw new ApiServiceError(
        error instanceof Error ? error.message : "An unexpected error occurred",
        "unknown"
      );
    }
  }

  private mapErrorCode(backendCode: string | undefined, status: number): ApiErrorCode {
    if (backendCode) {
      const mapping: Record<string, ApiErrorCode> = {
        no_symbols: "no_symbols",
        invalid_symbol: "invalid_symbol",
        no_valid_data: "no_valid_data",
        prediction_failed: "prediction_failed",
        invalid_request: "invalid_request",
        internal_error: "server_error",
      };
      return mapping[backendCode] ?? "unknown";
    }
    if (status >= 500) return "server_error";
    if (status === 400) return "invalid_request";
    return "unknown";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ─── Public API Methods ───────────────────────────────────────────────

  /**
   * Run LSTM prediction for one or more symbols.
   * This is the primary endpoint — triggers model training on the backend.
   */
  async predict(symbols: string[]): Promise<PredictResponse> {
    const data = await this.request<PredictResponse>("/predict", {
      method: "POST",
      body: JSON.stringify({ symbols }),
    });

    // Validate that at least one prediction was returned
    const hasPrediction = Object.values(data.predictions ?? {}).some(Boolean);
    if (!hasPrediction) {
      throw new ApiServiceError(
        "No valid predictions were returned",
        "prediction_failed",
        { details: data.errors }
      );
    }

    return data;
  }

  /**
   * Health check — verify backend is reachable.
   */
  async health(): Promise<HealthResponse> {
    return this.request<HealthResponse>("/health", { method: "GET" });
  }

  /**
   * Get the download URL for a result file.
   */
  resultFileUrl(filename: string): string {
    return `${this.baseUrl}/api/results/${encodeURIComponent(filename)}`;
  }

  /**
   * Download a result file (triggers browser download).
   */
  async downloadFile(filename: string): Promise<void> {
    const res = await fetch(this.resultFileUrl(filename));
    if (!res.ok) {
      throw new ApiServiceError(
        `Unable to download ${filename}`,
        "server_error",
        { status: res.status }
      );
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // ─── Future Endpoints (stubs) ─────────────────────────────────────────

  /**
   * Sentiment analysis — placeholder for Phase 2.
   */
  async sentiment(_symbol: string): Promise<SentimentResponse> {
    throw new ApiServiceError(
      "Sentiment analysis is not yet available",
      "server_error"
    );
  }

  /**
   * Market overview — placeholder for Phase 2.
   */
  async marketOverview(): Promise<MarketOverviewResponse> {
    throw new ApiServiceError(
      "Market overview is not yet available",
      "server_error"
    );
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────

/** Global API client instance */
export const api = new ApiClient();

// Re-export for backwards compatibility with existing imports
export const requestPrediction = (symbols: string[]) => api.predict(symbols);
export const checkHealth = () => api.health();
export const resultFileUrl = (filename: string) => api.resultFileUrl(filename);
export const downloadResultFile = (filename: string) => api.downloadFile(filename);
