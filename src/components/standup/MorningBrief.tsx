'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatCost, formatTokens } from '@/lib/format';

interface StandupRecord {
  id: string;
  date: string;
  content: any;
  created_at?: string;
}

interface StandupContent {
  date: string;
  summary: string;
  agents: { agent_id: string; agent_name: string; activities: string[]; tokens: number; cost: number }[];
  highlights: string[];
  blockers: string[];
  alerts: { id: string; message: string; severity?: string }[];
  overdue: { id: string; name: string; overdue_hours: number }[];
}

export default function MorningBrief() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [date, setDate] = useState(today);
  const [standup, setStandup] = useState<StandupContent | null>(null);
  const [history, setHistory] = useState<StandupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const parseContent = (row: StandupRecord | null): StandupContent | null => {
    if (!row) return null;
    const content = row.content;
    if (!content) return null;
    if (typeof content === 'string') {
      try { return JSON.parse(content); } catch { return null; }
    }
    return content as StandupContent;
  };

  const fetchStandup = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/standup?date=${date}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load standup');
      setStandup(parseContent(json.data));
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load standup');
      setLoading(false);
    }
  }, [date]);

  const fetchHistory = useCallback(async () => {
    const res = await fetch('/api/standup/history');
    const json = await res.json();
    if (res.ok) setHistory(json.data || []);
  }, []);

  useEffect(() => { fetchStandup(); }, [fetchStandup]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const generate = async () => {
    setError(null);
    const res = await fetch('/api/standup/generate', { method: 'POST', body: JSON.stringify({ date }) });
    const json = await res.json();
    if (!res.ok) {
      setError(json?.error || 'Failed to generate standup');
      return;
    }
    setStandup(parseContent(json.data));
    fetchHistory();
  };

  return (
    <div className="panel" style={{ borderColor: 'rgba(0,255,255,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 16, color: 'var(--accent-cyan)', margin: 0, textTransform: 'uppercase' }}>Morning Brief</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
          />
          <button
            onClick={fetchStandup}
            style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading standup…</div>
      ) : error ? (
        <div style={{ color: 'var(--accent-red)', fontSize: 15 }}>{error}</div>
      ) : !standup ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>No standup generated for this date.</div>
          <button onClick={generate} style={{ background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
            Generate
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5 }}>{standup.summary}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {standup.agents.map(agent => (
              <div key={agent.agent_id} className="panel" style={{ padding: 12 }}>
                <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-magenta)', marginBottom: 6 }}>{agent.agent_name}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Tokens: {formatTokens(agent.tokens)} · Cost: {formatCost(agent.cost)}</div>
                <ul style={{ margin: '8px 0 0 16px', padding: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
                  {agent.activities.slice(0, 3).map((a, idx) => (
                    <li key={idx}>{a}</li>
                  ))}
                  {agent.activities.length === 0 && <li>No activity logged</li>}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-cyan)', marginBottom: 6 }}>Highlights</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 14 }}>
                {standup.highlights.length ? standup.highlights.map((h, i) => <li key={i}>{h}</li>) : <li>No highlights recorded</li>}
              </ul>
            </div>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-amber)', marginBottom: 6 }}>Blockers</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 14 }}>
                {standup.blockers.length ? standup.blockers.map((b, i) => <li key={i}>{b}</li>) : <li>No blockers recorded</li>}
              </ul>
            </div>
            <div className="panel" style={{ padding: 12 }}>
              <div style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-red)', marginBottom: 6 }}>Overdue Tasks</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 14 }}>
                {standup.overdue?.length ? standup.overdue.map((t, i) => <li key={i}>{t.name} ({t.overdue_hours}h)</li>) : <li>No overdue tasks</li>}
              </ul>
            </div>
          </div>

          <button onClick={generate} style={{ background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '8px 16px', cursor: 'pointer', fontFamily: 'var(--font-heading)', alignSelf: 'flex-start' }}>
            Regenerate
          </button>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Recent Standups</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.slice(0, 7).map(item => {
            const isExpanded = expandedId === item.id;
            const content = parseContent(item);
            return (
              <div key={item.id}>
                <button
                  className="standup-history-item"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '6px 10px', cursor: 'pointer', textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span>{item.date}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && content && (
                  <div style={{ border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '10px 12px', fontSize: 14, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)' }}>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>{content.summary}</p>
                    {content.highlights?.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-cyan)', marginBottom: 4 }}>Highlights</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {content.highlights.map((h, i) => <li key={i}>{h}</li>)}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setDate(item.date); setExpandedId(null); }}
                      style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '4px 10px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 12, alignSelf: 'flex-start' }}
                    >
                      View Full Brief
                    </button>
                  </div>
                )}
                {isExpanded && !content && (
                  <div style={{ border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '10px 12px', fontSize: 14, color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)' }}>
                    No content available
                  </div>
                )}
              </div>
            );
          })}
          {history.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No history yet</div>}
        </div>
      </div>
    </div>
  );
}
