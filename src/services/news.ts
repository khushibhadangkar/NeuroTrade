/**
 * News intelligence service.
 *
 * Fetches real financial news from the backend's /market/news endpoint.
 */

const BASE =
  typeof window === "undefined"
    ? (process.env.NEUROTRADE_API_URL ?? "http://127.0.0.1:5001")
    : "/api/backend";

export interface NewsItem {
  headline: string;
  description: string;
  source: string;
  publishedAt: string;
  sentiment: "bullish" | "bearish" | "neutral";
  affectedSectors: string[];
  impact: "high" | "medium" | "low";
}

export async function fetchMarketNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(`${BASE}/market/news`, {
      headers: {
        "Content-Type": "application/json",
        "Bypass-Tunnel-Reminder": "true",
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.news ?? [];
  } catch {
    return [];
  }
}
