'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSmartPoll } from '@/hooks/useSmartPoll';

interface AlertEvaluation {
  id: string;
  rule_id: string;
  severity?: string;
  message: string;
  status: string;
  created_at: string;
}

const severityColor: Record<string, string> = {
  low: 'var(--accent-cyan)',
  info: 'var(--accent-cyan)',
  medium: 'var(--accent-amber)',
  warn: 'var(--accent-amber)',
  high: 'var(--accent-red)',
  critical: 'var(--accent-red)',
};

export default function NeedsAttention() {
  const [alerts, setAlerts] = useState<AlertEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/alerts');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load alerts');
      setAlerts(json.data || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts');
      setLoading(false);
    }
  }, []);

  const { refetch } = useSmartPoll(fetchAlerts, { intervalMs: 30000, enabled: true, immediate: true });

  useEffect(() => { refetch(); }, [refetch]);

  const dismiss = async (id: string) => {
    await fetch(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'dismissed' }) });
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="panel">
      <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        Needs Attention
      </h3>
      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading alerts…</div>
      ) : error ? (
        <div style={{ color: 'var(--accent-red)', fontSize: 15 }}>
          {error} <button onClick={refetch} style={{ marginLeft: 8, color: 'var(--accent-cyan)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : alerts.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--accent-green)', fontSize: 18 }}>✓ Nothing needs your attention</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map(alert => (
            <div key={alert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <div>
                <div style={{ color: severityColor[alert.severity || 'warn'] || 'var(--accent-amber)', fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>
                  {alert.severity || 'warn'}
                </div>
                <div style={{ fontSize: 16 }}>{alert.message}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{new Date(alert.created_at).toLocaleString()}</div>
              </div>
              <button
                onClick={() => dismiss(alert.id)}
                style={{ background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
