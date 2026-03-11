'use client';

import { MODEL_REGISTRY, ModelConfig } from '@/lib/arena/registry';

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: '#D97706',
  openai: '#10B981',
  google: '#3B82F6',
  xai: '#EF4444',
  ollama: '#8B5CF6',
};

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  xai: 'xAI',
  ollama: 'Local',
};

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function ModelSelector({ selected, onChange }: Props) {
  const [tooltip, setTooltip] = React.useState<string | null>(null);

  const handleToggle = (modelId: string) => {
    if (selected.includes(modelId)) {
      onChange(selected.filter(id => id !== modelId));
    } else {
      if (selected.length >= 3) {
        setTooltip(modelId);
        setTimeout(() => setTooltip(null), 1500);
        return;
      }
      onChange([...selected, modelId]);
    }
  };

  // Group by provider
  const groups: Record<string, ModelConfig[]> = {};
  for (const m of MODEL_REGISTRY) {
    if (!groups[m.provider]) groups[m.provider] = [];
    groups[m.provider].push(m);
  }

  const providerOrder = ['anthropic', 'openai', 'google', 'xai', 'ollama'];

  return (
    <div style={{
      background: '#1E293B',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 8,
      padding: '16px 20px',
    }}>
      <div style={{
        fontSize: 11,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}>
        MODEL SELECTOR <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>— select up to 3</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {providerOrder.map(provider => {
          const models = groups[provider];
          if (!models || models.length === 0) return null;
          const color = PROVIDER_COLORS[provider];
          return (
            <div key={provider} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{
                fontSize: 10,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.1em',
                color,
                textTransform: 'uppercase',
              }}>
                {PROVIDER_LABELS[provider]}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {models.map(m => {
                  const isActive = selected.includes(m.id);
                  const isDisabled = !m.enabled;
                  const showTip = tooltip === m.id;
                  return (
                    <div key={m.id} style={{ position: 'relative' }}>
                      {showTip && (
                        <div style={{
                          position: 'absolute',
                          bottom: 'calc(100% + 6px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#EF4444',
                          color: '#fff',
                          fontSize: 11,
                          padding: '4px 8px',
                          borderRadius: 4,
                          whiteSpace: 'nowrap',
                          zIndex: 10,
                          fontFamily: 'var(--font-heading)',
                        }}>
                          Max 3 models
                        </div>
                      )}
                      <button
                        onClick={() => !isDisabled && handleToggle(m.id)}
                        disabled={isDisabled}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontFamily: 'var(--font-heading)',
                          letterSpacing: '0.06em',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.15)'}`,
                          background: isActive ? color : 'transparent',
                          color: isActive ? '#fff' : isDisabled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)',
                          transition: 'all 0.15s ease',
                          opacity: isDisabled ? 0.5 : 1,
                        }}
                      >
                        {m.displayName}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-heading)' }}>
          {selected.length}/3 selected
        </div>
      )}
    </div>
  );
}

// Need React import for useState
import React from 'react';
