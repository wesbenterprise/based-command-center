'use client';

import { useState, useCallback } from 'react';
import { Agent } from '../../data/agents';
import { gatewayFetch } from '../../lib/gateway';

// ─── Types ───────────────────────────────────────────────────
interface PersonalityFile {
  id: string;
  label: string;
  filename: string;
  description: string;
}

interface FileContents {
  [fileId: string]: string;
}

// ─── Default personality file content per agent ───────────────
function getDefaultContent(agent: Agent, fileId: string): string {
  switch (fileId) {
    case 'soul':
      return `# ${agent.name} — SOUL.md

${agent.personalityBrief}

## Core Values
- Clarity over cleverness
- Honesty over comfort
- Precision over speed

## Voice & Tone
${agent.voiceSample ? `> ${agent.voiceSample}` : '(voice sample not set)'}

## What Drives Me
(Add deeper personality context here)
`;
    case 'agents':
      return `# ${agent.name} — Instructions (AGENTS.md)

## Role
${agent.role}

## Capabilities
${agent.capabilities.map(c => `- ${c}`).join('\n')}

## Boundaries
${agent.boundaries.map(b => `- ${b}`).join('\n')}

## Tools Available
${agent.tools.map(t => `- ${t}`).join('\n')}

## Collaboration
${agent.relationships.map(r => `- **${r.targetAgent}** (${r.type}): ${r.description}`).join('\n')}
`;
    case 'user':
      return `# ${agent.name} — About You (USER.md)

This file provides ${agent.name} with context about Wesley (the user).

## Wesley's Context
- Founder, multi-project operator
- Values: precision, honesty, execution speed
- Communication style: direct, concise, no fluff
- Time zone: Eastern US
- Key projects: (add your current projects here)

## Preferences
- Updates: asap for blockers, EOD for progress
- Format: bullets first, context below
- Escalate: anything that will miss a deadline or needs a decision
`;
    case 'identity':
      return `# ${agent.name} — Identity (IDENTITY.md)

## Agent Identity
- **Name:** ${agent.name}
- **Emoji:** ${agent.emoji}
- **Role:** ${agent.role}
- **Model:** ${agent.model}
- **Status:** ${agent.status}

## Activation Context
${agent.status === 'active' ? `${agent.name} is fully operational.` : agent.status === 'activating' ? `${agent.name} is in the activation phase.` : `${agent.name} is planned but not yet activated.`}

## Core Mission
(Describe ${agent.name}'s core mission and purpose in the system)
`;
    default:
      return '';
  }
}

const PERSONALITY_FILES: PersonalityFile[] = [
  {
    id: 'soul',
    label: 'SOUL.md',
    filename: 'SOUL.md',
    description: 'Core personality, values, voice, and character',
  },
  {
    id: 'agents',
    label: 'Instructions',
    filename: 'AGENTS.md',
    description: 'Agent role, capabilities, tools, and collaboration rules',
  },
  {
    id: 'user',
    label: 'About You',
    filename: 'USER.md',
    description: 'Context about the user (Wesley) for this agent',
  },
  {
    id: 'identity',
    label: 'Identity',
    filename: 'IDENTITY.md',
    description: 'Agent identity, activation status, and mission',
  },
] as const;

// Simple markdown renderer (no external deps)
function renderMarkdown(text: string): string {
  return text
    .replace(/^# (.+)$/gm, '<h1 style="color:var(--accent-magenta);font-family:var(--font-heading);font-size:18px;margin:16px 0 8px">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 style="color:var(--accent-cyan);font-family:var(--font-heading);font-size:15px;margin:14px 0 6px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="color:var(--text-secondary);font-family:var(--font-heading);font-size:13px;margin:12px 0 5px">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text-primary)">$1</strong>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid var(--accent-magenta);padding-left:12px;color:var(--text-muted);font-style:italic;margin:8px 0">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li style="color:var(--text-secondary);margin:3px 0;list-style:none;padding-left:12px">• $1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

// ─── Component ────────────────────────────────────────────────
export default function AgentPersonalityEditor({ agent }: { agent: Agent }) {
  const [activeFile, setActiveFile] = useState<string>('soul');
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [contents, setContents] = useState<FileContents>(() =>
    Object.fromEntries(PERSONALITY_FILES.map(f => [f.id, getDefaultContent(agent, f.id)]))
  );
  const [saveState, setSaveState] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [copyState, setCopyState] = useState<string | null>(null);

  const currentFile = PERSONALITY_FILES.find(f => f.id === activeFile)!;
  const currentContent = contents[activeFile] || '';

  async function handleSave() {
    setSaveState(prev => ({ ...prev, [activeFile]: 'saving' }));
    try {
      // TODO: replace with gateway API call to write personality file
      // await gatewayFetch('/api/agents/personality', {
      //   method: 'POST',
      //   body: JSON.stringify({ agentId: agent.id, file: currentFile.filename, content: currentContent }),
      // });
      await new Promise(r => setTimeout(r, 500)); // simulate save
      setSaveState(prev => ({ ...prev, [activeFile]: 'saved' }));
      setTimeout(() => setSaveState(prev => ({ ...prev, [activeFile]: 'idle' })), 2000);
    } catch {
      setSaveState(prev => ({ ...prev, [activeFile]: 'error' }));
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(currentContent);
    setCopyState(activeFile);
    setTimeout(() => setCopyState(null), 2000);
  }

  const saveStatus = saveState[activeFile] || 'idle';
  const isCopied = copyState === activeFile;

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧬</span>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Personality Editor
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Edit {agent.name}'s character files directly
            </div>
          </div>
        </div>
        {/* Edit / Preview toggle */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          {(['edit', 'preview'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                background: mode === m ? 'rgba(255,0,255,0.15)' : 'transparent',
                border: 'none',
                color: mode === m ? 'var(--accent-magenta)' : 'var(--text-muted)',
                padding: '5px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}
            >
              {m === 'edit' ? '✏️ Edit' : '👁 Preview'}
            </button>
          ))}
        </div>
      </div>

      {/* File Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {PERSONALITY_FILES.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFile(f.id)}
            title={f.description}
            style={{
              background: activeFile === f.id ? 'rgba(255,0,255,0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeFile === f.id ? '2px solid var(--accent-magenta)' : '2px solid transparent',
              color: activeFile === f.id ? 'var(--accent-magenta)' : 'var(--text-muted)',
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: 13,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.04em',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* File description */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
        <code style={{ color: 'var(--accent-cyan)' }}>{currentFile.filename}</code>
        {' '}· {currentFile.description}
      </div>

      {/* Editor / Preview */}
      {mode === 'edit' ? (
        <textarea
          value={currentContent}
          onChange={e => setContents(prev => ({ ...prev, [activeFile]: e.target.value }))}
          style={{
            width: '100%',
            minHeight: 320,
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            padding: '12px 14px',
            color: 'var(--text-primary)',
            fontSize: 13,
            fontFamily: 'monospace',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,0,255,0.3)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          spellCheck={false}
        />
      ) : (
        <div
          style={{
            minHeight: 320,
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4,
            padding: '14px 18px',
            fontSize: 14,
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            overflowY: 'auto',
          }}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(currentContent) }}
        />
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 'auto' }}>
          {currentContent.split('\n').length} lines · {currentContent.length} chars
        </span>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,255,255,0.3)',
            color: isCopied ? 'var(--accent-green)' : 'var(--accent-cyan)',
            borderRadius: 4,
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.05em',
            transition: 'all 0.15s',
          }}
        >
          {isCopied ? '✓ Copied!' : '📋 Copy'}
        </button>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          style={{
            background: saveStatus === 'saved' ? 'rgba(0,255,0,0.15)' : saveStatus === 'error' ? 'rgba(239,68,68,0.15)' : 'rgba(255,0,255,0.15)',
            border: `1px solid ${saveStatus === 'saved' ? 'var(--accent-green)' : saveStatus === 'error' ? 'var(--accent-red)' : 'var(--accent-magenta)'}`,
            color: saveStatus === 'saved' ? 'var(--accent-green)' : saveStatus === 'error' ? 'var(--accent-red)' : 'var(--accent-magenta)',
            borderRadius: 4,
            padding: '6px 18px',
            cursor: saveStatus === 'saving' ? 'wait' : 'pointer',
            fontSize: 12,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.05em',
            transition: 'all 0.15s',
          }}
        >
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'error' ? '✕ Error' : '💾 Save'}
        </button>
      </div>

      {/* Gateway note */}
      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>
        Save writes via Gateway API · Copy to clipboard as fallback if gateway is offline
      </div>
    </div>
  );
}
