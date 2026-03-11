'use client';

import { useState } from 'react';

interface HistoryRun {
  id: string;
  prompt_text: string;
  selected_models: string[];
  status: string;
  created_at: string;
}

interface HistoryResponse {
  id: string;
  run_id: string;
  provider: string;
  model_display_name: string;
  response_text?: string | null;
  latency_ms?: number | null;
  token_count_in?: number | null;
  token_count_out?: number | null;
  error?: string | null;
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#D97706',
  openai: '#10B981',
  google: '#3B82F6',
  xai: '#EF4444',
  ollama: '#8B5CF6',
};

interface Props {
  runs: HistoryRun[];
  responses: Record<string, HistoryResponse[]>;
  onLoadPrompt: (prompt: string) => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'numeric', day: 'numeric' }) + ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RunHistory({ runs, responses, onLoadPrompt }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (runs.length === 0) {
    return (
      <div style={{ padding: '20px 0', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'var(--font-heading)' }}>
        No runs yet — run your first prompt above
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {runs.map(run => {
        const isExpanded = expanded === run.id;
        const runResponses = responses[run.id] ?? [];
        const modelNames = runResponses.map(r => r.model_display_name.replace('Claude ', '').replace('GPT-', '').split(' ')[0]);

        return (
          <div key={run.id}>
            <div
              onClick={() => setExpanded(isExpanded ? null : run.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                cursor: 'pointer',
                borderRadius: 5,
                background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)', minWidth: 90 }}>
                {formatDate(run.created_at)}
              </span>
              <span style={{ flex: 1, fontSize: 13, color: '#CBD5E1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {run.prompt_text.slice(0, 70)}{run.prompt_text.length > 70 ? '…' : ''}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {runResponses.map(r => (
                  <span key={r.id} style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 3,
                    background: `${PROVIDER_COLORS[r.provider] ?? '#6366F1'}22`,
                    color: PROVIDER_COLORS[r.provider] ?? '#6366F1',
                    fontFamily: 'var(--font-heading)',
                  }}>
                    {r.model_display_name.split(' ').slice(-1)[0]}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
              <div style={{
                margin: '0 8px 8px',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: 6,
                border: '1px solid rgba(255,255,255,0.06)',
                overflow: 'hidden',
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#F1F5F9', lineHeight: 1.5, flex: 1 }}>{run.prompt_text}</p>
                  <button
                    onClick={() => onLoadPrompt(run.prompt_text)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'rgba(255,255,255,0.6)',
                      padding: '4px 12px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      fontSize: 11,
                      fontFamily: 'var(--font-heading)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Load Prompt
                  </button>
                </div>
                {runResponses.map(resp => (
                  <div key={resp.id} style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontFamily: 'var(--font-heading)', color: PROVIDER_COLORS[resp.provider] ?? '#fff' }}>
                        {resp.model_display_name}
                      </span>
                      {resp.latency_ms && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{(resp.latency_ms / 1000).toFixed(1)}s</span>
                      )}
                      {resp.token_count_in && resp.token_count_out && (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{resp.token_count_in}→{resp.token_count_out} tok</span>
                      )}
                    </div>
                    {resp.error ? (
                      <p style={{ margin: 0, fontSize: 12, color: '#FCA5A5' }}>Error: {resp.error}</p>
                    ) : (
                      <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                        {resp.response_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
