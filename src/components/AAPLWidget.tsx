"use client";

import { useState, useEffect } from "react";

const COST_BASIS = 257.37;

interface StockData {
  price: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
}

export default function AAPLWidget() {
  const [stock, setStock] = useState<StockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/stock/aapl");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setStock(data);
        setError(null);
      } catch {
        setError("Unable to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const gainFromBasis = stock ? stock.price - COST_BASIS : 0;
  const gainPctFromBasis = stock ? ((stock.price - COST_BASIS) / COST_BASIS) * 100 : 0;
  const basisPositive = gainFromBasis >= 0;

  const dayPositive = stock ? stock.change >= 0 : true;

  return (
    <div
      className="panel"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 18px",
        minHeight: 72,
      }}
    >
      {/* Apple Logo + Ticker */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 90 }}>
        <span style={{ fontSize: 28 }}>🍎</span>
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: 16,
              color: "var(--text-primary)",
              letterSpacing: "0.08em",
            }}
          >
            AAPL
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Apple Inc.</div>
        </div>
      </div>

      {/* Current Price */}
      <div style={{ textAlign: "center", minWidth: 90 }}>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 22,
            color: "var(--text-primary)",
            letterSpacing: "0.04em",
          }}
        >
          {loading ? "—" : error ? "ERR" : `$${stock!.price.toFixed(2)}`}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Current</div>
      </div>

      {/* Today's Change */}
      <div style={{ textAlign: "center", minWidth: 100 }}>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            color: loading || error
              ? "var(--text-muted)"
              : dayPositive
                ? "var(--accent-green)"
                : "#ff4444",
          }}
        >
          {loading
            ? "—"
            : error
              ? "—"
              : `${dayPositive ? "+" : ""}${stock!.change.toFixed(2)} (${dayPositive ? "+" : ""}${stock!.changePercent.toFixed(2)}%)`}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Today</div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 36,
          background: "var(--border-subtle)",
          flexShrink: 0,
        }}
      />

      {/* Gain from Cost Basis */}
      <div style={{ textAlign: "center", minWidth: 130 }}>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 15,
            color: loading || error
              ? "var(--text-muted)"
              : basisPositive
                ? "var(--accent-green)"
                : "#ff4444",
          }}
        >
          {loading
            ? "—"
            : error
              ? "—"
              : `${basisPositive ? "+" : ""}$${gainFromBasis.toFixed(2)} (${basisPositive ? "+" : ""}${gainPctFromBasis.toFixed(1)}%)`}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          vs. Basis ${COST_BASIS.toFixed(2)}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 36,
          background: "var(--border-subtle)",
          flexShrink: 0,
        }}
      />

      {/* Earnings Note */}
      <div style={{ textAlign: "center", minWidth: 100 }}>
        <div
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: 13,
            color: "var(--accent-amber)",
            letterSpacing: "0.04em",
          }}
        >
          📅 Apr 30
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Earnings Release
        </div>
      </div>
    </div>
  );
}
