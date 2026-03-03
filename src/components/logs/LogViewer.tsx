'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { agents } from '@/data/agents';
import { useSmartPoll } from '@/hooks/useSmartPoll';

interface LogEntry {
  id: string;
  agent_id: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

const levelColors: Record<string, string> = {
  debug: 'var(--text-muted)',
  info: 'var(--accent-cyan)',
  warn: 'var(--accent-amber)',
  error: 'var(--accent-red)',
};

const agentMap = agents.reduce<Record<string, string>>((acc, agent) => {
  acc[agent.id] = agent.name;
  return acc;
}, {});

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState('all');
  const [agent, setAgent] = useState('');
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  const fetchLogs = useCallback(async () => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '200');
    if (level && level !== 'all') params.set('level', level);
    if (agent) params.set('agent', agent);
    if (source) params.set('source', source);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/logs?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load logs');
      const list = (json.data || []) as LogEntry[];
      setLogs(list.reverse());
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load logs');
      setLoading(false);
    }
  }, [level, agent, source, search]);

  const { refetch } = useSmartPoll(fetchLogs, { intervalMs: 5000, enabled: true, immediate: true });

  useEffect(() => { refetch(); }, [level, agent, source, search, refetch]);

  useEffect(() => {
    if (!autoScroll) return;
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const agentOptions = useMemo(() => agents.map(a => ({ id: a.id, name: a.name })), []);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Log Viewer
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
          >
            <option value="all">All Levels</option>
            <option value="debug">debug</option>
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
          <select
            value={agent}
            onChange={e => setAgent(e.target.value)}
            style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
          >
            <option value="">All Agents</option>
            {agentOptions.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <input
            value={source}
            onChange={e => setSource(e.target.value)}
            placeholder="Source"
            style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, minWidth: 120 }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search"
            style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6, minWidth: 160 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 14 }}>
            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
            Auto-scroll
          </label>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading logs…</div>
      ) : error ? (
        <div style={{ color: 'var(--accent-red)', fontSize: 15 }}>
          {error} <button onClick={refetch} style={{ marginLeft: 8, color: 'var(--accent-cyan)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No logs found</div>
      ) : (
        <div ref={containerRef} style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 6 }}>
          {logs.map(log => (
            <div key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                <span>{new Date(log.created_at).toLocaleString()}</span>
                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [log.id]: !prev[log.id] }))}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 13 }}
                >
                  {expanded[log.id] ? 'Hide' : 'Details'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <span style={{ color: levelColors[log.level], fontFamily: 'var(--font-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 13 }}>
                  {log.level}
                </span>
                <span style={{ color: 'var(--accent-magenta)', fontSize: 15 }}>{agentMap[log.agent_id] || log.agent_id}</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{log.source}</span>
              </div>
              <div style={{ fontSize: 15, marginTop: 4 }}>{log.message}</div>
              {expanded[log.id] && log.metadata && (
                <pre style={{ marginTop: 8, background: 'rgba(0,0,0,0.3)', padding: 10, fontSize: 12, color: 'var(--text-secondary)', overflowX: 'auto' }}>
{JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
