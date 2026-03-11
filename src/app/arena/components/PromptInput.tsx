'use client';

import { useState, useRef, useEffect } from 'react';

interface SaveModalProps {
  onSave: (title: string, tags: string[]) => void;
  onClose: () => void;
}

function SaveModal({ onSave, onClose }: SaveModalProps) {
  const [title, setTitle] = useState('');
  const [tagInput, setTagInput] = useState('');

  const handleSave = () => {
    if (!title.trim()) return;
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave(title.trim(), tags);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#1E293B',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: 28,
          width: 380,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 14, fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: '#F1F5F9' }}>
          SAVE TO LIBRARY
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)' }}>Title *</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Explain quantum computing"
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 5,
              padding: '8px 12px',
              color: '#F1F5F9',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)' }}>Tags (comma-separated)</label>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="e.g. science, explainer"
            style={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 5,
              padding: '8px 12px',
              color: '#F1F5F9',
              fontSize: 13,
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.5)',
              padding: '7px 16px',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-heading)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            style={{
              background: title.trim() ? '#D97706' : 'rgba(217,119,6,0.3)',
              border: 'none',
              color: '#fff',
              padding: '7px 20px',
              borderRadius: 5,
              cursor: title.trim() ? 'pointer' : 'not-allowed',
              fontSize: 12,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
  onSave: (title: string, tags: string[]) => void;
  canRun: boolean;
  running: boolean;
}

export default function PromptInput({ value, onChange, onRun, onSave, canRun, running }: Props) {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
    }
  }, [value]);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <>
      <div style={{
        background: '#1E293B',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Enter your prompt..."
            style={{
              width: '100%',
              minHeight: 120,
              padding: '14px 16px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F1F5F9',
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'none',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 10,
            right: 12,
            fontSize: 11,
            color: 'rgba(255,255,255,0.25)',
            fontFamily: 'var(--font-heading)',
            pointerEvents: 'none',
          }}>
            {wordCount}w · {charCount}c
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '10px 16px',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        }}>
          <button
            onClick={onRun}
            disabled={!canRun || running}
            style={{
              background: canRun && !running ? '#D97706' : 'rgba(217,119,6,0.25)',
              border: 'none',
              color: canRun && !running ? '#fff' : 'rgba(255,255,255,0.4)',
              padding: '8px 22px',
              borderRadius: 5,
              cursor: canRun && !running ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.08em',
              transition: 'all 0.15s ease',
            }}
          >
            {running ? '⏳ Running...' : '▶ Run'}
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={!value.trim()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              color: value.trim() ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
              padding: '8px 16px',
              borderRadius: 5,
              cursor: value.trim() ? 'pointer' : 'not-allowed',
              fontSize: 13,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.06em',
              transition: 'all 0.15s ease',
            }}
          >
            💾 Save to Library
          </button>
        </div>
      </div>

      {showSaveModal && (
        <SaveModal
          onSave={(title, tags) => {
            onSave(title, tags);
            setShowSaveModal(false);
          }}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </>
  );
}
