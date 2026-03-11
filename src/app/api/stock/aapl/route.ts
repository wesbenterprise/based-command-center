import { NextResponse } from "next/server";

// Cache stock data for 60 seconds to avoid hammering the API
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // Use Yahoo Finance v8 API (no key needed)
    const res = await fetch(
      "https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1d",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 60 },
      }
    );

    if (!res.ok) {
      throw new Error(`Yahoo Finance returned ${res.status}`);
    }

    const json = await res.json();
    const result = json.chart?.result?.[0];
    const meta = result?.meta;

    if (!meta) {
      throw new Error("No chart data");
    }

    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = price - previousClose;
    const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;
    const dayHigh = meta.regularMarketDayHigh ?? price;
    const dayLow = meta.regularMarketDayLow ?? price;

    const data = {
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
      dayHigh: Math.round(dayHigh * 100) / 100,
      dayLow: Math.round(dayLow * 100) / 100,
      updatedAt: new Date().toISOString(),
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    // Fallback: return cached data if available, even if stale
    if (cache) {
      return NextResponse.json({ ...cache.data as object, stale: true });
    }
    return NextResponse.json(
      { error: "Failed to fetch stock data", detail: String(err) },
      { status: 502 }
    );
  }
}
