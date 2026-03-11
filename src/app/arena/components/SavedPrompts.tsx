'use client';

import { useState } from 'react';

interface SavedPrompt {
  id: string;
  title: string;
  prompt_text: string;
  tags: string[];
  updated_at: string;
}

interface Props {
  prompts: SavedPrompt[];
  onLoad: (promptText: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SavedPrompt>) => void;
  onNew: () => void;
}

interface EditModalProps {
  prompt: SavedPrompt;
  onSave: (updates: Partial<SavedPrompt>) => void;
  onClose: () => void;
}

function EditModal({ prompt, onSave, onClose }: EditModalProps) {
  const [title, setTitle] = useState(prompt.title);
  const [text, setText] = useState(prompt.prompt_text);
  const [tagInput, setTagInput] = useState((prompt.tags ?? []).join(', '));

  const handleSave = () => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ title: title.trim(), prompt_text: text, tags });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: '#1E293B', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          padding: 28, width: 480, display: 'flex', flexDirection: 'column', gap: 16,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 14, fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: '#F1F5F9' }}>
          EDIT PROMPT
        </div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          style={{
            background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
            padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
          style={{
            background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
            padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
        <input
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          placeholder="Tags (comma-separated)"
          style={{
            background: '#0F172A', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 5,
            padding: '8px 12px', color: '#F1F5F9', fontSize: 13, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.5)', padding: '7px 16px', borderRadius: 5,
            cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)',
          }}>Cancel</button>
          <button onClick={handleSave} style={{
            background: '#10B981', border: 'none', color: '#fff', padding: '7px 20px',
            borderRadius: 5, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)',
          }}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function SavedPrompts({ prompts, onLoad, onDelete, onUpdate, onNew }: Props) {
  const [editing, setEditing] = useState<SavedPrompt | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (prompts.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'var(--font-heading)' }}>
          No saved prompts yet
        </div>
        <button onClick={onNew} style={{
          background: '#10B981', border: 'none', color: '#fff', padding: '7px 18px',
          borderRadius: 5, cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-heading)',
        }}>
          + New Prompt
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button onClick={onNew} style={{
          background: '#10B981', border: 'none', color: '#fff', padding: '6px 14px',
          borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-heading)',
        }}>
          + New
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {prompts.map(p => (
          <div key={p.id} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 6, padding: '10px 14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-heading)', color: '#F1F5F9', marginBottom: 3 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.prompt_text.slice(0, 80)}{p.prompt_text.length > 80 ? '…' : ''}
                </div>
                {(p.tags ?? []).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                    {(p.tags ?? []).map(tag => (
                      <span key={tag} style={{
                        fontSize: 10, padding: '1px 6px', borderRadius: 3,
                        background: 'rgba(99,102,241,0.2)', color: '#818CF8',
                        fontFamily: 'var(--font-heading)',
                      }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => onLoad(p.prompt_text)}
                  style={{
                    background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                    color: '#10B981', padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                    fontSize: 11, fontFamily: 'var(--font-heading)',
                  }}
                >
                  Load
                </button>
                <button
                  onClick={() => setEditing(p)}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.5)', padding: '4px 10px', borderRadius: 4,
                    cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-heading)',
                  }}
                >
                  Edit
                </button>
                {confirmDelete === p.id ? (
                  <>
                    <button onClick={() => { onDelete(p.id); setConfirmDelete(null); }} style={{
                      background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                      color: '#EF4444', padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
                      fontSize: 11, fontFamily: 'var(--font-heading)',
                    }}>Confirm</button>
                    <button onClick={() => setConfirmDelete(null)} style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.4)', padding: '4px 8px', borderRadius: 4,
                      cursor: 'pointer', fontSize: 11,
                    }}>✕</button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(p.id)}
                    style={{
                      background: 'transparent', border: '1px solid rgba(239,68,68,0.2)',
                      color: 'rgba(239,68,68,0.6)', padding: '4px 8px', borderRadius: 4,
                      cursor: 'pointer', fontSize: 11,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <EditModal
          prompt={editing}
          onSave={updates => { onUpdate(editing.id, updates); setEditing(null); }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
