'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UsageStats {
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_usd: number;
  sessions: number;
}

interface AgentUsage {
  day: UsageStats;
  week: UsageStats;
  month: UsageStats;
}

function formatTokens(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function formatCost(n: number): string {
  return '$' + n.toFixed(2);
}

function formatIdleTime(lastActive?: string): string {
  if (!lastActive) return '—';
  const diff = Date.now() - new Date(lastActive).getTime();
  if (diff < 0) return '—';
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function idleColor(lastActive?: string): string {
  if (!lastActive) return 'var(--text-muted)';
  const diff = Date.now() - new Date(lastActive).getTime();
  const hrs = diff / 3600000;
  if (hrs < 1) return 'var(--accent-green)';
  if (hrs < 12) return 'var(--accent-cyan)';
  if (hrs < 48) return 'var(--accent-amber)';
  return 'var(--text-muted)';
}

export default function AgentStats({ taskCount, deliverableCount, agentId }: { taskCount: number; deliverableCount?: number; agentId?: string }) {
  const [usage, setUsage] = useState<AgentUsage | null>(null);
  const [heartbeat, setHeartbeat] = useState<string | undefined>(undefined);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    if (!agentId) return;
    fetch(`/api/agent-usage?agent=${agentId}`)
      .then(r => r.json())
      .then(data => { if (!data.error) setUsage(data); })
      .catch(() => {});
    fetch('/api/heartbeats')
      .then(r => r.json())
      .then(data => { if (data[agentId!]) setHeartbeat(data[agentId!]); })
      .catch(() => {});
  }, [agentId]);

  const current = usage ? usage[period] : null;

  const stat = (label: string, value: string, color: string, href?: string, subtitle?: string) => (
    <div className="panel" style={{ textAlign: 'center', flex: 1, minWidth: 130 }}>
      {href ? (
        <Link href={href} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, color, lineHeight: 1 }}>{value}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
          {subtitle && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{subtitle}</div>}
        </Link>
      ) : (
        <>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 26, color, lineHeight: 1 }}>{value}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
          {subtitle && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{subtitle}</div>}
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Period toggle */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {(['day', 'week', 'month'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            style={{
              background: period === p ? 'rgba(255,0,255,0.15)' : 'transparent',
              border: `1px solid ${period === p ? 'var(--accent-magenta)' : 'var(--border-subtle)'}`,
              color: period === p ? 'var(--accent-magenta)' : 'var(--text-muted)',
              borderRadius: 4,
              padding: '4px 12px',
              fontSize: 12,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {p === 'day' ? '24H' : p === 'week' ? '7D' : '30D'}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {stat('Tasks', String(taskCount), 'var(--accent-cyan)')}
        {stat('Deliverables', deliverableCount !== undefined ? String(deliverableCount) : '—', 'var(--accent-magenta)', agentId ? `/output?agent=${agentId}` : undefined)}
        {stat(
          'Tokens',
          current ? formatTokens(current.total_tokens) : '—',
          'var(--accent-cyan)',
          undefined,
          current ? `${formatTokens(current.tokens_in)} in · ${formatTokens(current.tokens_out)} out` : undefined
        )}
        {stat('Sessions', current ? String(current.sessions) : '—', 'var(--accent-green)')}
        {stat('Cost', current ? formatCost(current.cost_usd) : '—', 'var(--accent-amber)')}
        {stat('Last Active', formatIdleTime(heartbeat), idleColor(heartbeat))}
      </div>
    </div>
  );
}
