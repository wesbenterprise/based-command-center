'use client';

import { useState, useEffect } from 'react';
import { gatewayFetch } from '../lib/gateway';

interface ApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  command: string;
  workingDir: string;
  reason: string;
  timestamp: string;
  urgency: 'critical' | 'high' | 'normal';
}

// Detect urgency from command
function detectUrgency(cmd: string): ApprovalRequest['urgency'] {
  const c = cmd.toLowerCase();
  if (c.includes('rm ') || c.includes('delete') || c.includes('drop ') || c.includes('force')) return 'critical';
  if (c.includes('git push') || c.includes('deploy') || c.includes('curl') || c.includes('wget')) return 'high';
  return 'normal';
}

// Mock data — TODO: replace with GET /api/exec/pending when gateway API exists
const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'exec-1',
    agentId: 'dezayas',
    agentName: 'Dezayas',
    agentEmoji: '🔧',
    command: 'git push origin main --force-with-lease',
    workingDir: '/workspace/rru-sentinel',
    reason: 'Deploy hotfix for authentication regression',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    urgency: 'high',
  },
  {
    id: 'exec-2',
    agentId: 'ace',
    agentName: 'Ace',
    agentEmoji: '♠️',
    command: 'curl -X POST https://api.telegram.org/bot... -d "text=Morning brief ready"',
    workingDir: '/workspace/ace-core',
    reason: 'Send morning brief to Wesley via Telegram',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    urgency: 'normal',
  },
];

const EXEC_APPROVALS_ENABLED = process.env.NEXT_PUBLIC_EXEC_APPROVALS_ENABLED === 'true';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function relativeTimeFull(iso: string): string {
  const d = new Date(iso);
  const rel = relativeTime(iso);
  const abs = d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${rel} (${abs})`;
}

const urgencyConfig = {
  critical: { border: 'var(--accent-red)', label: 'CRITICAL', color: 'var(--accent-red)', glow: true },
  high: { border: 'var(--accent-amber)', label: 'HIGH', color: 'var(--accent-amber)', glow: false },
  normal: { border: 'rgba(255,255,255,0.12)', label: 'NORMAL', color: 'var(--text-muted)', glow: false },
};

export default function ExecApprovals() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [acting, setActing] = useState<Record<string, 'approving' | 'denying'>>({});

  useEffect(() => {
    if (EXEC_APPROVALS_ENABLED) {
      // TODO: replace with real gateway poll
      // gatewayFetch('/api/exec/pending').then(setApprovals).catch(() => {});
    } else {
      // Show mock data for UI preview
      setApprovals(MOCK_APPROVALS);
    }
  }, []);

  const visible = approvals.filter(a => !dismissed.has(a.id));

  async function handleApprove(id: string) {
    setActing(prev => ({ ...prev, [id]: 'approving' }));
    // TODO: POST /api/exec/approve with { id }
    await new Promise(r => setTimeout(r, 600));
    setDismissed(prev => new Set([...prev, id]));
    setActing(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function handleDeny(id: string) {
    setActing(prev => ({ ...prev, [id]: 'denying' }));
    // TODO: POST /api/exec/deny with { id }
    await new Promise(r => setTimeout(r, 600));
    setDismissed(prev => new Set([...prev, id]));
    setActing(prev => { const n = { ...prev }; delete n[id]; return n; });
  }

  return (
    <div className="panel">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔐</span>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Exec Approval Queue
            </h3>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Commands awaiting your authorization
              {!EXEC_APPROVALS_ENABLED && (
                <span style={{ marginLeft: 8, color: 'var(--accent-amber)', fontSize: 10 }}>[DEMO DATA]</span>
              )}
            </div>
          </div>
        </div>
        {visible.length > 0 && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 4,
            padding: '3px 10px',
            fontSize: 12,
            color: 'var(--accent-red)',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.06em',
          }}>
            {visible.length} PENDING
          </div>
        )}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)' }}>
          <div className="empty-float" style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '0.08em' }}>
            All clear — no pending approvals
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Fleet operating autonomously</div>
        </div>
      )}

      {/* Approval cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(req => {
          const cfg = urgencyConfig[req.urgency];
          const isActing = !!acting[req.id];
          return (
            <div
              key={req.id}
              className={req.urgency === 'critical' ? 'approval-urgent' : ''}
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: `1px solid ${cfg.border}`,
                borderRadius: 6,
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                {/* Left: agent + command info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{req.agentEmoji}</span>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--text-primary)' }}>{req.agentName}</span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px',
                      background: `${cfg.color}20`,
                      border: `1px solid ${cfg.color}50`,
                      borderRadius: 2,
                      color: cfg.color,
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.06em',
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }} title={relativeTimeFull(req.timestamp)}>
                      {relativeTime(req.timestamp)}
                    </span>
                  </div>

                  {/* Command */}
                  <div style={{
                    fontFamily: 'monospace',
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    padding: '6px 10px',
                    color: req.urgency === 'critical' ? 'var(--accent-red)' : 'var(--accent-cyan)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    marginBottom: 6,
                  }}>
                    $ {req.command}
                  </div>

                  <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                    <span><span style={{ color: 'var(--text-muted)' }}>cwd:</span> {req.workingDir}</span>
                  </div>
                  {req.reason && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                      "{req.reason}"
                    </div>
                  )}
                </div>

                {/* Right: action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button
                    disabled={isActing}
                    onClick={() => handleApprove(req.id)}
                    style={{
                      background: acting[req.id] === 'approving' ? 'rgba(0,255,0,0.2)' : 'rgba(0,255,0,0.1)',
                      border: '1px solid var(--accent-green)',
                      color: 'var(--accent-green)',
                      borderRadius: 4,
                      padding: '6px 14px',
                      cursor: isActing ? 'wait' : 'pointer',
                      fontSize: 13,
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.05em',
                      transition: 'all 0.15s',
                      minWidth: 80,
                    }}
                  >
                    {acting[req.id] === 'approving' ? '...' : '✓ Approve'}
                  </button>
                  <button
                    disabled={isActing}
                    onClick={() => handleDeny(req.id)}
                    style={{
                      background: acting[req.id] === 'denying' ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)',
                      border: '1px solid var(--accent-red)',
                      color: 'var(--accent-red)',
                      borderRadius: 4,
                      padding: '6px 14px',
                      cursor: isActing ? 'wait' : 'pointer',
                      fontSize: 13,
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.05em',
                      transition: 'all 0.15s',
                      minWidth: 80,
                    }}
                  >
                    {acting[req.id] === 'denying' ? '...' : '✕ Deny'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
