'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────
interface Task {
  id: string;
  priority: 'critical' | 'today' | 'waiting' | 'done';
  title: string;
  description: string;
  status: 'open' | 'blocked' | 'waiting' | 'done';
  blockedBy: 'wesley' | 'agent' | null;
}

interface TasksResponse {
  tasks: Task[];
  updatedAt: string;
}

// ─── Helpers ────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

// ─── Status Pill ────────────────────────────────────────────
function StatusPill({ status }: { status: Task['status'] }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    open:    { bg: 'rgba(0,255,255,0.1)',   color: 'var(--accent-cyan)',    label: 'OPEN' },
    blocked: { bg: 'rgba(239,68,68,0.12)',  color: 'var(--accent-red)',     label: 'BLOCKED' },
    waiting: { bg: 'rgba(234,179,8,0.12)', color: 'var(--accent-amber)',   label: 'WAITING' },
    done:    { bg: 'rgba(0,255,0,0.1)',    color: 'var(--accent-green)',   label: 'DONE' },
  };
  const c = cfg[status] || cfg.open;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 3,
      fontSize: 10,
      fontFamily: 'var(--font-heading)',
      letterSpacing: '0.1em',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.color}`,
    }}>
      {c.label}
    </span>
  );
}

// ─── Task Card ──────────────────────────────────────────────
function TaskCard({
  task,
  glowColor,
  borderBase,
  onClick,
}: {
  task: Task;
  glowColor: string;
  borderBase: string;
  onClick: (t: Task) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const isWesleyBlocked = task.blockedBy === 'wesley';
  const isAgentWorking  = task.blockedBy === 'agent';

  const borderColor = isWesleyBlocked
    ? 'rgba(234,179,8,0.5)'
    : hovered
    ? borderBase
    : 'rgba(255,255,255,0.08)';

  const boxShadow = hovered
    ? `0 0 12px ${glowColor}, 0 4px 24px rgba(0,0,0,0.4)`
    : `0 2px 8px rgba(0,0,0,0.3)`;

  return (
    <div
      onClick={() => onClick(task)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '14px 16px',
        background: 'var(--bg-surface, rgba(20,20,28,0.9))',
        border: `1px solid ${borderColor}`,
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Blocked badges */}
      {isWesleyBlocked && (
        <div style={{
          fontSize: 11,
          color: 'var(--accent-amber)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.06em',
        }}>
          ⏳ Waiting on Wesley
        </div>
      )}
      {isAgentWorking && (
        <div style={{
          fontSize: 11,
          color: 'var(--accent-cyan)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.06em',
        }}>
          🤖 Agent working
        </div>
      )}

      {/* Title */}
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 14,
        color: 'var(--text-primary)',
        letterSpacing: '0.04em',
        lineHeight: 1.3,
      }}>
        {task.title}
      </div>

      {/* Description preview */}
      {task.description && (
        <div style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {task.description}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
        <StatusPill status={task.status} />
      </div>
    </div>
  );
}

// ─── Column ─────────────────────────────────────────────────
function TaskColumn({
  label,
  tasks,
  glowColor,
  borderBase,
  headerColor,
  onCardClick,
}: {
  label: string;
  tasks: Task[];
  glowColor: string;
  borderBase: string;
  headerColor: string;
  onCardClick: (t: Task) => void;
}) {
  return (
    <div style={{
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: 10,
        borderBottom: `1px solid ${borderBase}`,
      }}>
        <span style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 13,
          letterSpacing: '0.12em',
          color: headerColor,
          textShadow: `0 0 8px ${glowColor}`,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'VT323, monospace',
          fontSize: 18,
          color: headerColor,
          opacity: 0.7,
        }}>
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tasks.length === 0 ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 6,
          }}>
            No items
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              glowColor={glowColor}
              borderBase={borderBase}
              onClick={onCardClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Slide-out Detail Panel ──────────────────────────────────
function DetailPanel({ task, onClose }: { task: Task | null; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  const priorityCfg: Record<string, { color: string; label: string }> = {
    critical: { color: 'var(--accent-red)',   label: '🔴 CRITICAL' },
    today:    { color: 'var(--accent-amber)', label: '🟡 ACTIVE' },
    waiting:  { color: 'var(--accent-amber)', label: '⏳ WAITING' },
    done:     { color: 'var(--accent-green)', label: '🟢 DONE' },
  };
  const pc = priorityCfg[task.priority] || priorityCfg.today;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 100,
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        maxWidth: '100vw',
        background: 'rgba(12,12,18,0.98)',
        borderLeft: '1px solid rgba(255,0,255,0.2)',
        zIndex: 101,
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
        animation: 'slideInRight 0.25s ease',
      }}>
        {/* Panel Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.1em',
              color: pc.color,
              marginBottom: 8,
            }}>
              {pc.label}
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}>
              {task.title}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: 18,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Panel Body */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <StatusPill status={task.status} />
            {task.blockedBy === 'wesley' && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 3,
                fontSize: 10,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.08em',
                background: 'rgba(234,179,8,0.12)',
                color: 'var(--accent-amber)',
                border: '1px solid var(--accent-amber)',
              }}>
                ⏳ Waiting on Wesley
              </span>
            )}
            {task.blockedBy === 'agent' && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 3,
                fontSize: 10,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.08em',
                background: 'rgba(0,255,255,0.08)',
                color: 'var(--accent-cyan)',
                border: '1px solid var(--accent-cyan)',
              }}>
                🤖 Agent working
              </span>
            )}
          </div>

          {/* Description */}
          {task.description ? (
            <div>
              <div style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.1em',
                marginBottom: 8,
              }}>
                DETAILS
              </div>
              <p style={{
                color: 'var(--text-secondary)',
                fontSize: 14,
                lineHeight: 1.65,
                margin: 0,
              }}>
                {task.description}
              </p>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              No additional details.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [now, setNow] = useState(new Date());

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data: TasksResponse = await res.json();
        setTasks(data.tasks);
        setUpdatedAt(data.updatedAt);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60_000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  // Tick for relative time display
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(tick);
  }, []);

  // Column definitions
  const criticalTasks = tasks.filter(t => t.priority === 'critical');
  const activeTasks   = tasks.filter(t => t.priority === 'today' || t.priority === 'waiting');
  const doneTasks     = tasks.filter(t => t.priority === 'done');

  const totalCritical = criticalTasks.length;
  const totalActive   = activeTasks.length;
  const totalDone     = doneTasks.length;

  return (
    <main style={{ padding: '24px 24px 40px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
          <h1 style={{
            fontFamily: 'Orbitron, var(--font-heading)',
            fontSize: 26,
            letterSpacing: '0.14em',
            margin: 0,
            color: 'var(--accent-magenta)',
            textShadow: '0 0 20px rgba(255,0,255,0.5), 0 0 40px rgba(255,0,255,0.2)',
          }}>
            AGENDA
          </h1>
          {!loading && (
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              color: 'var(--text-muted)',
              letterSpacing: '0.06em',
            }}>
              <span style={{ color: 'var(--accent-red)' }}>{totalCritical} critical</span>
              {' · '}
              <span style={{ color: 'var(--accent-amber)' }}>{totalActive} active</span>
              {' · '}
              <span style={{ color: 'var(--accent-green)' }}>{totalDone} completed</span>
            </span>
          )}
        </div>
        {updatedAt && (
          <div style={{
            marginTop: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            fontFamily: 'VT323, monospace',
            letterSpacing: '0.06em',
          }}>
            {/* Force now to be used for reactivity */}
            {now && relativeTime(updatedAt)} ({absoluteTime(updatedAt)})
          </div>
        )}
      </div>

      {/* Board */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 200,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.1em',
          fontSize: 14,
        }}>
          LOADING AGENDA...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 20,
        }}
        className="tasks-grid"
        >
          <TaskColumn
            label="🔴 CRITICAL"
            tasks={criticalTasks}
            glowColor="rgba(239,68,68,0.5)"
            borderBase="rgba(239,68,68,0.4)"
            headerColor="var(--accent-red)"
            onCardClick={setSelectedTask}
          />
          <TaskColumn
            label="🟡 ACTIVE"
            tasks={activeTasks}
            glowColor="rgba(234,179,8,0.5)"
            borderBase="rgba(234,179,8,0.4)"
            headerColor="var(--accent-amber)"
            onCardClick={setSelectedTask}
          />
          <TaskColumn
            label="🟢 COMPLETED"
            tasks={doneTasks}
            glowColor="rgba(0,255,0,0.4)"
            borderBase="rgba(0,255,0,0.3)"
            headerColor="var(--accent-green)"
            onCardClick={setSelectedTask}
          />
        </div>
      )}

      {/* Detail panel */}
      <DetailPanel task={selectedTask} onClose={() => setSelectedTask(null)} />

      <style>{`
        @media (max-width: 768px) {
          .tasks-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
