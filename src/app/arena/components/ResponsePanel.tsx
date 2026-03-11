'use client';

import { useState } from 'react';
import ProgressTimer from './ProgressTimer';

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#D97706',
  openai: '#10B981',
  google: '#3B82F6',
  xai: '#EF4444',
  ollama: '#8B5CF6',
};

const PROVIDER_BADGES: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
  ollama: 'Local',
};

interface ResponseData {
  provider: string;
  model_display_name: string;
  response_text?: string | null;
  latency_ms?: number | null;
  token_count_in?: number | null;
  token_count_out?: number | null;
  error?: string | null;
}

interface Props {
  modelId: string;
  displayName: string;
  provider: string;
  estimatedMs: number;
  running: boolean;
  response?: ResponseData | null;
}

export default function ResponsePanel({ displayName, provider, estimatedMs, running, response }: Props) {
  const [copied, setCopied] = useState(false);
  const color = PROVIDER_COLORS[provider] ?? '#6366F1';
  const completed = !!response;
  const hasError = !!response?.error;

  const handleCopy = () => {
    if (response?.response_text) {
      navigator.clipboard.writeText(response.response_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div style={{
      background: hasError ? 'rgba(239,68,68,0.08)' : '#1E293B',
      border: `1px solid ${hasError ? 'rgba(239,68,68,0.3)' : completed ? `${color}33` : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 8,
      display: 'flex',
      flexDirection: 'column',
      minHeight: 280,
      overflow: 'hidden',
      transition: 'border-color 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${hasError ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 13,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.06em',
            color: '#F1F5F9',
          }}>
            {displayName}
          </span>
          <span style={{
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 3,
            background: `${color}22`,
            color,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.08em',
          }}>
            {PROVIDER_BADGES[provider] ?? provider}
          </span>
        </div>
        {completed && response?.latency_ms && !hasError && (
          <span style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-heading)',
          }}>
            {(response.latency_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!completed && running && (
          <ProgressTimer
            provider={provider}
            estimatedMs={estimatedMs}
            running={running}
            completed={false}
          />
        )}

        {completed && !hasError && response?.response_text && (
          <div style={{
            flex: 1,
            fontSize: 13,
            lineHeight: 1.65,
            color: '#CBD5E1',
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
            maxHeight: 400,
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {response.response_text}
          </div>
        )}

        {completed && hasError && (
          <div style={{
            fontSize: 13,
            color: '#FCA5A5',
            fontFamily: 'var(--font-heading)',
          }}>
            Error: {response?.error}
          </div>
        )}

        {completed && !hasError && response?.response_text && (
          <ProgressTimer
            provider={provider}
            estimatedMs={estimatedMs}
            running={false}
            completed={true}
          />
        )}
      </div>

      {/* Footer */}
      {completed && !hasError && (
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-heading)' }}>
            {response?.token_count_in ?? 0}→{response?.token_count_out ?? 0} tok
          </span>
          <button
            onClick={handleCopy}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: copied ? color : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em',
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
