'use client';

import { useState, useEffect, useCallback } from 'react';
import { gatewayFetch, GatewayOfflineError } from '../../lib/gateway';

// ─── Types ───────────────────────────────────────────────────
interface GatewayStatus {
  connected: boolean;
  latencyMs: number | null;
  version?: string;
  uptime?: string;
}

interface ProviderStatus {
  id: string;
  name: string;
  icon: string;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  models: string[];
  lastCall?: string;
  errorRate?: number;
}

interface ChannelStatus {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastMessage?: string;
  messageCount?: number;
}

interface CronHealth {
  total: number;
  healthy: number;
  failing: number;
}

function relativeTime(iso?: string): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusDot({ status }: { status: 'online' | 'degraded' | 'offline' | 'unknown' | boolean }) {
  if (typeof status === 'boolean') {
    return <span className={status ? 'health-dot-online' : 'health-dot-offline'} />;
  }
  const cls = status === 'online' ? 'health-dot-online' : status === 'degraded' ? 'health-dot-degraded' : 'health-dot-offline';
  return <span className={cls} />;
}

// ─── Gateway Status Card ──────────────────────────────────────
function GatewayCard({ status }: { status: GatewayStatus }) {
  const stateColor = status.connected ? 'var(--accent-green)' : 'var(--accent-red)';
  return (
    <div className="panel" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌐</span>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '0.08em' }}>OpenClaw Gateway</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>localhost:18789</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={status.connected ? 'online' : 'offline'} />
          <span style={{ fontSize: 12, color: stateColor, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
            {status.connected ? 'CONNECTED' : 'OFFLINE'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>LATENCY</div>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-heading)', color: status.latencyMs === null ? 'var(--text-muted)' : status.latencyMs < 100 ? 'var(--accent-green)' : status.latencyMs < 300 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
            {status.latencyMs !== null ? `${status.latencyMs}ms` : '—'}
          </div>
        </div>
        {status.version && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>VERSION</div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>{status.version}</div>
          </div>
        )}
        {status.uptime && (
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>UPTIME</div>
            <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>{status.uptime}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Provider Cards ───────────────────────────────────────────
function ProviderCard({ p }: { p: ProviderStatus }) {
  const statusColor = p.status === 'online' ? 'var(--accent-green)' : p.status === 'degraded' ? 'var(--accent-amber)' : p.status === 'offline' ? 'var(--accent-red)' : 'var(--text-muted)';
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: `1px solid ${p.status === 'online' ? 'rgba(0,255,0,0.15)' : p.status === 'degraded' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 6,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{p.icon}</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, letterSpacing: '0.04em' }}>{p.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <StatusDot status={p.status} />
          <span style={{ fontSize: 11, color: statusColor, fontFamily: 'var(--font-heading)' }}>{p.status.toUpperCase()}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--text-muted)' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>MODELS </span>
          <span style={{ color: 'var(--text-secondary)' }}>{p.models.length}</span>
        </div>
        {p.lastCall && (
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>LAST CALL </span>
            <span style={{ color: 'var(--text-secondary)' }}>{relativeTime(p.lastCall)}</span>
          </div>
        )}
        {p.errorRate !== undefined && (
          <div>
            <span style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>ERR RATE </span>
            <span style={{ color: p.errorRate > 5 ? 'var(--accent-red)' : p.errorRate > 1 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
              {p.errorRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {/* Model pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
        {p.models.slice(0, 4).map(m => (
          <span key={m} style={{
            fontSize: 10, padding: '1px 6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            color: 'var(--text-muted)',
            fontFamily: 'monospace',
          }}>
            {m}
          </span>
        ))}
        {p.models.length > 4 && (
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{p.models.length - 4}</span>
        )}
      </div>
    </div>
  );
}

// ─── Channel Card ─────────────────────────────────────────────
function ChannelCard({ ch }: { ch: ChannelStatus }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: `1px solid ${ch.connected ? 'rgba(0,255,0,0.15)' : 'rgba(239,68,68,0.2)'}`,
      borderRadius: 6,
      padding: '12px 14px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{ch.icon}</span>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13 }}>{ch.name}</div>
          {ch.lastMessage && (
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Last: {relativeTime(ch.lastMessage)}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
          <StatusDot status={ch.connected} />
          <span style={{ fontSize: 11, color: ch.connected ? 'var(--accent-green)' : 'var(--accent-red)', fontFamily: 'var(--font-heading)' }}>
            {ch.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </span>
        </div>
        {ch.messageCount !== undefined && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {ch.messageCount} msgs today
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cron Health Bar ──────────────────────────────────────────
function CronHealthBar({ health }: { health: CronHealth }) {
  const pct = health.total > 0 ? (health.healthy / health.total) * 100 : 0;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 6,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13 }}>⚡ Cron Jobs</span>
        <span style={{ fontSize: 12, color: health.failing > 0 ? 'var(--accent-amber)' : 'var(--accent-green)', fontFamily: 'var(--font-heading)' }}>
          {health.healthy}/{health.total} healthy
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: pct > 90 ? 'var(--accent-green)' : pct > 70 ? 'var(--accent-amber)' : 'var(--accent-red)',
          borderRadius: 3,
          transition: 'width 0.5s ease',
        }} />
      </div>
      {health.failing > 0 && (
        <div style={{ fontSize: 11, color: 'var(--accent-amber)', marginTop: 6 }}>
          {health.failing} job{health.failing > 1 ? 's' : ''} failing — check CRON page
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function ConnectionHealth() {
  const [gateway, setGateway] = useState<GatewayStatus>({ connected: false, latencyMs: null });
  const [providers] = useState<ProviderStatus[]>([
    // TODO: replace with gateway API call to GET /api/config or /api/health
    {
      id: 'anthropic', name: 'Anthropic', icon: '🤖', status: 'online',
      models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4'],
      lastCall: new Date(Date.now() - 3 * 60000).toISOString(), errorRate: 0.0,
    },
    {
      id: 'google', name: 'Google AI', icon: '🔵', status: 'online',
      models: ['gemini-2.5-pro', 'gemini-2.0-flash'],
      lastCall: new Date(Date.now() - 45 * 60000).toISOString(), errorRate: 0.2,
    },
    {
      id: 'openai', name: 'OpenAI', icon: '⚪', status: 'online',
      models: ['gpt-5', 'gpt-5-mini', 'o3'],
      lastCall: new Date(Date.now() - 2 * 3600000).toISOString(), errorRate: 0.1,
    },
    {
      id: 'xai', name: 'xAI', icon: '✖️', status: 'unknown',
      models: ['grok-3', 'grok-3-mini'],
      lastCall: undefined, errorRate: undefined,
    },
  ]);
  const [channels] = useState<ChannelStatus[]>([
    // TODO: replace with gateway API call
    { id: 'telegram', name: 'Telegram', icon: '✈️', connected: true, lastMessage: new Date(Date.now() - 8 * 60000).toISOString(), messageCount: 43 },
    { id: 'discord', name: 'Discord', icon: '💬', connected: false, lastMessage: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), messageCount: 0 },
    { id: 'email', name: 'Email (SMTP)', icon: '📧', connected: true, lastMessage: new Date(Date.now() - 25 * 60000).toISOString(), messageCount: 7 },
  ]);
  const [cronHealth, setCronHealth] = useState<CronHealth>({ total: 0, healthy: 0, failing: 0 });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const checkGateway = useCallback(async () => {
    const start = Date.now();
    try {
      const data = await gatewayFetch<{ version?: string; uptime?: string }>('/api/health');
      const latencyMs = Date.now() - start;
      setGateway({
        connected: true,
        latencyMs,
        version: data?.version || 'v1.x',
        uptime: data?.uptime,
      });
    } catch (e) {
      if (e instanceof GatewayOfflineError) {
        setGateway({ connected: false, latencyMs: null });
      } else {
        // Got a response (gateway is up but health endpoint may 404)
        const latencyMs = Date.now() - start;
        setGateway({ connected: true, latencyMs });
      }
    }
  }, []);

  const checkCronHealth = useCallback(async () => {
    try {
      const data = await gatewayFetch<{ jobs?: any[] } | any[]>('/api/cron');
      const jobs = Array.isArray(data) ? data : (data?.jobs ?? []);
      const total = jobs.length;
      const failing = jobs.filter((j: any) => j.lastStatus === 'error' || j.status === 'failed').length;
      setCronHealth({ total, healthy: total - failing, failing });
    } catch {
      // ignore
    }
  }, []);

  const refresh = useCallback(() => {
    checkGateway();
    checkCronHealth();
    setLastRefresh(new Date());
  }, [checkGateway, checkCronHealth]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🔌</span>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Connection Health
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Auto-refreshes every 30s · last: {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,255,255,0.3)',
            color: 'var(--accent-cyan)',
            borderRadius: 4,
            padding: '5px 12px',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.05em',
            transition: 'all 0.15s',
          }}
        >
          ↻ Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Gateway */}
        <GatewayCard status={gateway} />

        {/* Providers */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
            Model Providers
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
            {providers.map(p => <ProviderCard key={p.id} p={p} />)}
          </div>
        </div>

        {/* Channels */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
            Messaging Channels
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {channels.map(ch => <ChannelCard key={ch.id} ch={ch} />)}
          </div>
        </div>

        {/* Cron health */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
            Automation Health
          </div>
          <CronHealthBar health={cronHealth} />
        </div>
      </div>
    </div>
  );
}
