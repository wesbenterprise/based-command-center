"use client";

import { useState, useEffect, useRef } from "react";

interface ModelOption {
  value: string;
  label: string;
  tier: string;
}

const TIER_COLORS: Record<string, string> = {
  premium: 'var(--accent-magenta)',
  standard: 'var(--accent-cyan)',
  fast: 'var(--accent-green)',
};

const TIER_LABELS: Record<string, string> = {
  premium: 'Premium',
  standard: 'Standard',
  fast: 'Fast',
};

export default function AgentModelConfig({ agentId, staticModel }: { agentId: string; staticModel: string }) {
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/agents/models').then(r => r.json()),
      fetch('/api/agents/models/available').then(r => r.json()),
    ]).then(([models, available]) => {
      const model = models[agentId] || 'unknown';
      setCurrentModel(model);
      setSelectedModel(model);
      setAvailableModels(available);
      setLoading(false);
    }).catch(() => {
      setCurrentModel('unknown');
      setLoading(false);
    });
  }, [agentId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangeModel = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setSaving(true);
    setConfirming(false);
    setFeedback(null);
    try {
      const res = await fetch('/api/agents/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, model: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to change model');
      setCurrentModel(selectedModel);
      setFeedback({ type: 'success', message: `Model changed to ${selectedModel}` });
    } catch (err) {
      setFeedback({ type: 'error', message: String(err instanceof Error ? err.message : err) });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setConfirming(false);
    setSelectedModel(currentModel || '');
  };

  const currentOption = availableModels.find(m => m.value === currentModel);
  const selectedOption = availableModels.find(m => m.value === selectedModel);
  const hasChanged = selectedModel !== currentModel;
  const runtimeDiffers = currentModel && currentModel !== 'unknown' && currentModel !== staticModel.toLowerCase().replace(/\s+/g, '-');
  // Group models by tier
  const tiers = ['premium', 'standard', 'fast'] as const;

  if (loading) {
    return (
      <div className="panel" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-heading)' }}>
          Model Configuration
        </h3>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading model data...</div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: 20 }}>
      <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-heading)' }}>
        Model Configuration
      </h3>

      {/* Current Model Display */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
          Current Model
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            padding: '6px 14px',
            border: `1px solid ${currentOption ? TIER_COLORS[currentOption.tier] : 'var(--accent-cyan)'}`,
            color: currentOption ? TIER_COLORS[currentOption.tier] : 'var(--accent-cyan)',
            fontFamily: 'var(--font-heading)',
            fontSize: 15,
            letterSpacing: '0.04em',
            boxShadow: `0 0 12px ${currentOption ? TIER_COLORS[currentOption.tier] : 'var(--accent-cyan)'}33`,
          }}>
            {currentOption ? currentOption.label : currentModel}
          </span>
          {currentOption && (
            <span style={{
              padding: '2px 8px',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontFamily: 'var(--font-heading)',
              color: TIER_COLORS[currentOption.tier],
              border: `1px solid ${TIER_COLORS[currentOption.tier]}44`,
              borderRadius: 2,
            }}>
              {TIER_LABELS[currentOption.tier]}
            </span>
          )}
          {runtimeDiffers && (
            <span style={{
              padding: '2px 8px',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontFamily: 'var(--font-heading)',
              color: 'var(--accent-amber)',
              border: '1px solid var(--accent-amber)',
              borderRadius: 2,
            }}>
              ⚠ Runtime Override
            </span>
          )}
        </div>
      </div>

      {/* Model Selector */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
          Switch Model
        </div>
        <div ref={dropdownRef} style={{ position: 'relative', maxWidth: 400 }}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(15, 18, 25, 0.9)',
              border: `1px solid ${hasChanged ? 'var(--accent-magenta)' : 'var(--border-subtle)'}`,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{selectedOption ? selectedOption.label : selectedModel || 'Select model...'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{dropdownOpen ? '▲' : '▼'}</span>
          </button>

          {dropdownOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              background: 'rgba(10, 12, 18, 0.98)',
              border: '1px solid var(--border-subtle)',
              borderTop: 'none',
              maxHeight: 320,
              overflowY: 'auto',
            }}>
              {tiers.map(tier => {
                const tierModels = availableModels.filter(m => m.tier === tier);
                if (tierModels.length === 0) return null;
                return (
                  <div key={tier}>
                    <div style={{
                      padding: '6px 14px',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      color: TIER_COLORS[tier],
                      fontFamily: 'var(--font-heading)',
                      borderBottom: '1px solid var(--border-subtle)',
                      background: 'rgba(255,255,255,0.02)',
                    }}>
                      {TIER_LABELS[tier]}
                    </div>
                    {tierModels.map(m => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.value);
                          setDropdownOpen(false);
                          setConfirming(false);
                        }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '8px 14px',
                          background: m.value === selectedModel ? 'rgba(255,255,255,0.06)' : 'transparent',
                          border: 'none',
                          borderBottom: '1px solid var(--border-subtle)',
                          color: m.value === currentModel ? TIER_COLORS[m.tier] : 'var(--text-primary)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 14,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                      >
                        {m.label}
                        {m.value === currentModel && (
                          <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-muted)' }}>● current</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanged && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {confirming ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--accent-amber)', fontFamily: 'var(--font-heading)' }}>
                ⚠ This changes the live agent. Confirm?
              </span>
              <button
                onClick={handleChangeModel}
                disabled={saving}
                style={{
                  padding: '8px 18px',
                  background: 'var(--accent-magenta)',
                  border: 'none',
                  color: '#000',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? 'Changing...' : 'Confirm'}
              </button>
              <button
                onClick={handleCancel}
                style={{
                  padding: '8px 14px',
                  background: 'transparent',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleChangeModel}
              style={{
                padding: '8px 18px',
                background: 'transparent',
                border: '1px solid var(--accent-magenta)',
                color: 'var(--accent-magenta)',
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                cursor: 'pointer',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Change Model
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div style={{
          marginTop: 12,
          padding: '8px 12px',
          fontSize: 13,
          fontFamily: 'var(--font-heading)',
          color: feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
          border: `1px solid ${feedback.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)'}44`,
        }}>
          {feedback.type === 'success' ? '✓' : '✗'} {feedback.message}
        </div>
      )}
    </div>
  );
}
