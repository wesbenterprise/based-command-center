'use client';

import { useCallback, useEffect, useState } from 'react';

type Mode = 'workhorse' | 'bigbrain';

const modeConfig: Record<Mode, { label: string; icon: string; desc: string; color: string }> = {
  workhorse: {
    label: 'Workhorse',
    icon: '🐴',
    desc: 'Fast sweeps — X, Reddit, web monitoring',
    color: 'var(--accent-green)',
  },
  bigbrain: {
    label: 'Big Brain',
    icon: '🧠',
    desc: 'Deep reasoning — full Grok-4 analysis',
    color: 'var(--accent-magenta)',
  },
};

export default function ScoutModeToggle({ compact = false }: { compact?: boolean }) {
  const [mode, setMode] = useState<Mode>('workhorse');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    fetch('/api/scout-mode')
      .then(r => r.json())
      .then(data => {
        if (data.mode) setMode(data.mode);
        setInitialized(true);
      })
      .catch(() => setInitialized(true));
  }, []);

  const toggle = useCallback(async () => {
    const next: Mode = mode === 'workhorse' ? 'bigbrain' : 'workhorse';
    setLoading(true);
    try {
      const res = await fetch('/api/scout-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      });
      const data = await res.json();
      if (data.ok) setMode(next);
    } catch (e) {
      console.error('Failed to switch Scout mode:', e);
    }
    setLoading(false);
  }, [mode]);

  const cfg = modeConfig[mode];
  const otherMode = mode === 'workhorse' ? 'bigbrain' : 'workhorse';
  const otherCfg = modeConfig[otherMode];

  if (!initialized) return null;

  if (compact) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        style={{
          background: 'rgba(15,18,25,0.9)',
          border: `1px solid ${cfg.color}`,
          color: cfg.color,
          padding: '6px 14px',
          fontFamily: 'var(--font-heading)',
          fontSize: 13,
          cursor: loading ? 'wait' : 'pointer',
          letterSpacing: '0.06em',
          transition: 'all 0.2s',
          opacity: loading ? 0.5 : 1,
        }}
        title={`Switch to ${otherCfg.label}`}
      >
        {cfg.icon} {cfg.label.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="panel" style={{ borderColor: `${cfg.color}33` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{
          fontSize: 15, color: 'var(--text-muted)', margin: 0,
          textTransform: 'uppercase', letterSpacing: '0.15em',
        }}>
          🦅 Scout Mode
        </h3>
        <span style={{
          fontSize: 12, fontFamily: 'var(--font-heading)',
          color: cfg.color, letterSpacing: '0.08em',
        }}>
          {cfg.icon} {cfg.label.toUpperCase()}
        </span>
      </div>

      <p style={{ margin: '0 0 16px 0', fontSize: 15, color: 'var(--text-secondary)' }}>
        {cfg.desc}
      </p>

      <div style={{ display: 'flex', gap: 8 }}>
        {(Object.entries(modeConfig) as [Mode, typeof cfg][]).map(([key, m]) => (
          <button
            key={key}
            onClick={() => { if (key !== mode) toggle(); }}
            disabled={loading}
            style={{
              flex: 1,
              background: key === mode ? `${m.color}15` : 'transparent',
              border: `1px solid ${key === mode ? m.color : 'var(--border-subtle)'}`,
              color: key === mode ? m.color : 'var(--text-muted)',
              padding: '10px 16px',
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              cursor: key === mode ? 'default' : (loading ? 'wait' : 'pointer'),
              letterSpacing: '0.06em',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}
