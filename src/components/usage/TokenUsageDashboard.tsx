'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { agents } from '@/data/agents';
import { formatCost, formatTokens } from '@/lib/format';
import { useSmartPoll } from '@/hooks/useSmartPoll';
import CostStatCard from './CostStatCard';

interface TokenUsageRow {
  id: string;
  agent_id: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  session_id?: string | null;
  recorded_at: string;
}

type RangeOption = '24h' | '7d' | '30d';

const rangeLabel: Record<RangeOption, string> = {
  '24h': 'Last 24h',
  '7d': 'Last 7d',
  '30d': 'Last 30d',
};

function dateKey(date: Date, bucket: 'hour' | 'day') {
  if (bucket === 'hour') {
    return date.toISOString().slice(0, 13) + ':00';
  }
  return date.toISOString().slice(0, 10);
}

const agentNameMap = agents.reduce<Record<string, string>>((acc, agent) => {
  acc[agent.id] = agent.name;
  return acc;
}, {});

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,18,25,0.95)', border: '1px solid var(--accent-magenta)', padding: '8px 10px', fontSize: 13 }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} style={{ color: entry.color, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{entry.name}</span>
          <span>{formatter ? formatter(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function TokenUsageDashboard() {
  const [range, setRange] = useState<RangeOption>('7d');
  const [rows, setRows] = useState<TokenUsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    setError(null);
    setLoading(true);
    const now = new Date();
    const since = new Date(now);
    if (range === '24h') since.setHours(now.getHours() - 24);
    if (range === '7d') since.setDate(now.getDate() - 7);
    if (range === '30d') since.setDate(now.getDate() - 30);

    const params = new URLSearchParams();
    params.set('since', since.toISOString());
    params.set('until', now.toISOString());

    try {
      const res = await fetch(`/api/token-usage?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load usage');
      setRows(json.data || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load usage');
      setLoading(false);
    }
  }, [range]);

  const { refetch } = useSmartPoll(fetchUsage, { intervalMs: 30000, enabled: true, immediate: true });

  useEffect(() => { refetch(); }, [range, refetch]);

  const stats = useMemo(() => {
    const totalTokens = rows.reduce((sum, row) => sum + (row.tokens_in || 0) + (row.tokens_out || 0), 0);
    const totalCost = rows.reduce((sum, row) => sum + (row.cost_usd || 0), 0);
    const requestCount = rows.length;
    const avgTokens = requestCount ? Math.round(totalTokens / requestCount) : 0;
    return { totalTokens, totalCost, requestCount, avgTokens };
  }, [rows]);

  const costSeries = useMemo(() => {
    const bucket: 'hour' | 'day' = range === '24h' ? 'hour' : 'day';
    const map = new Map<string, { label: string; cost: number }>();
    rows.forEach(row => {
      const key = dateKey(new Date(row.recorded_at), bucket);
      if (!map.has(key)) map.set(key, { label: key, cost: 0 });
      map.get(key)!.cost += row.cost_usd || 0;
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label)).map(item => ({
      label: bucket === 'hour' ? item.label.slice(11, 16) : item.label,
      cost: Number(item.cost.toFixed(4)),
    }));
  }, [rows, range]);

  const modelBreakdown = useMemo(() => {
    const map = new Map<string, { model: string; tokens: number; cost: number }>();
    rows.forEach(row => {
      const key = row.model || 'unknown';
      if (!map.has(key)) map.set(key, { model: key, tokens: 0, cost: 0 });
      const entry = map.get(key)!;
      entry.tokens += (row.tokens_in || 0) + (row.tokens_out || 0);
      entry.cost += row.cost_usd || 0;
    });
    return Array.from(map.values()).sort((a, b) => b.tokens - a.tokens);
  }, [rows]);

  const agentBreakdown = useMemo(() => {
    const map = new Map<string, { agent: string; tokensIn: number; tokensOut: number; cost: number }>();
    rows.forEach(row => {
      const key = row.agent_id || 'unknown';
      if (!map.has(key)) map.set(key, { agent: key, tokensIn: 0, tokensOut: 0, cost: 0 });
      const entry = map.get(key)!;
      entry.tokensIn += row.tokens_in || 0;
      entry.tokensOut += row.tokens_out || 0;
      entry.cost += row.cost_usd || 0;
    });
    const totalCost = stats.totalCost || 1;
    return Array.from(map.values())
      .map(entry => ({
        ...entry,
        percent: (entry.cost / totalCost) * 100,
      }))
      .sort((a, b) => b.cost - a.cost);
  }, [rows, stats.totalCost]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Token Usage & Cost
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['24h', '7d', '30d'] as RangeOption[]).map(option => (
            <button
              key={option}
              onClick={() => setRange(option)}
              style={{
                background: range === option ? 'rgba(255,0,255,0.15)' : 'transparent',
                border: `1px solid ${range === option ? 'var(--accent-magenta)' : 'var(--border-subtle)'}`,
                color: range === option ? 'var(--accent-magenta)' : 'var(--text-secondary)',
                padding: '6px 12px',
                cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {rangeLabel[option]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading token usage…</div>
      ) : error ? (
        <div style={{ color: 'var(--accent-red)', fontSize: 15 }}>
          {error} <button onClick={refetch} style={{ marginLeft: 8, color: 'var(--accent-cyan)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <CostStatCard label="Total Tokens" value={formatTokens(stats.totalTokens)} accent="var(--accent-magenta)" />
            <CostStatCard label="Total Cost" value={formatCost(stats.totalCost)} accent="var(--accent-cyan)" />
            <CostStatCard label="Requests" value={String(stats.requestCount)} accent="var(--accent-green)" />
            <CostStatCard label="Avg Tokens / Req" value={formatTokens(stats.avgTokens)} accent="var(--accent-amber)" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            <div style={{ minHeight: 220 }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Cost Over Time</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={costSeries}>
                  <XAxis dataKey="label" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatCost(v)} />} />
                  <Line type="monotone" dataKey="cost" name="Cost" stroke="#ff00ff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ minHeight: 220 }}>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Tokens by Model</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={modelBreakdown}>
                  <XAxis dataKey="model" stroke="var(--text-muted)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" tickLine={false} axisLine={false} tickFormatter={(v) => formatTokens(v)} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => formatTokens(v)} />} />
                  <Bar dataKey="tokens" name="Tokens" fill="#00e5ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Per-Agent Cost</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agentBreakdown.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No usage recorded yet</div>
              )}
              {agentBreakdown.map(row => (
                <div key={row.agent} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 0.6fr', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 15 }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>{agentNameMap[row.agent] || row.agent}</span>
                  <span>In: {formatTokens(row.tokensIn)}</span>
                  <span>Out: {formatTokens(row.tokensOut)}</span>
                  <span style={{ color: 'var(--accent-magenta)' }}>{formatCost(row.cost)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{row.percent.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
