"use client";

import { useState, useCallback, useEffect } from "react";
import { categories } from "../apps.config";
import { tasks as fallbackTasks, Task } from "../data/tasks";
import { agents } from "../data/agents";
import { supabase } from "../lib/supabase";
import Image from "next/image";
import Link from "next/link";
import EntityManagement from "../components/entities/EntityManagement";

// ─── Types ─────────────────────────────────────────────────
interface FlaggedEmail {
  id: string;
  gmail_id: string;
  subject: string;
  sender: string;
  sender_domain: string;
  received_at: string;
  priority: 'red' | 'yellow' | 'green';
  agents: { agent: string; reason: string }[];
  status: string;
}

interface Stats {
  tasks: number;
  flags: number;
  proposals: number;
  emails: number;
  hasRedEmail: boolean;
}

// ─── Tab Definitions ───────────────────────────────────────
const tabs = [
  { id: "hq", label: "HQ", icon: "🏠" },
  { id: "ops", label: "Ops", icon: "⚡" },
  { id: "intel", label: "Intel", icon: "📊" },
  { id: "apps", label: "Apps", icon: "🧩" },
  { id: "chat", label: "Chat", icon: "💬" },
];

const agentNameMap = agents.reduce<Record<string, string>>((acc, agent) => {
  acc[agent.name] = agent.id;
  return acc;
}, {});

// ─── Hooks ─────────────────────────────────────────────────
function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>(fallbackTasks);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('standing_orders')
        .select('*')
        .order('id');
      if (!error && data && data.length > 0) {
        const mapped: Task[] = data.map((row: Record<string, unknown>) => {
          const lastRun = row.last_run ? new Date(row.last_run as string).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never';
          const freqMap: Record<string, Task['frequency']> = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual', yearly: 'Annual' };
          const freq = freqMap[(row.frequency as string || '').toLowerCase()] || 'Daily';
          const isActive = row.active !== false;
          const health: Task['health'] = !isActive ? 'red' : (row.urgent ? 'amber' : 'green');
          return {
            id: row.id as number,
            name: row.name as string,
            project: (row.project as string) || 'General',
            frequency: freq,
            health,
            lastRun,
            active: isActive,
            urgent: row.urgent as boolean,
          };
        });
        setTasks(mapped);
      }
      setLoading(false);
    })();
  }, []);

  return { tasks, loading };
}

function useFlaggedEmails() {
  const [emails, setEmails] = useState<FlaggedEmail[]>([]);

  const fetchEmails = useCallback(async () => {
    const { data } = await supabase
      .from('flagged_emails')
      .select('*')
      .eq('status', 'active')
      .order('priority');
    if (data) {
      const parsed = data.map((row: Record<string, unknown>) => ({
        ...row,
        agents: typeof row.agents === 'string' ? JSON.parse(row.agents) : (row.agents || []),
        priority: row.priority === 'amber' ? 'yellow' : row.priority,
      }));
      setEmails(parsed as FlaggedEmail[]);
    }
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const dismiss = async (id: string) => {
    await supabase.from('flagged_emails').update({ status: 'dismissed', dismissed_at: new Date().toISOString() }).eq('id', id);
    setEmails(prev => prev.filter(e => e.id !== id));
  };

  const sendFeedback = async (email: FlaggedEmail, rejectionType: string) => {
    // Write feedback for each agent that flagged it
    const feedbackRows = email.agents.map(a => ({
      gmail_id: email.gmail_id,
      agent: a.agent,
      subject: email.subject,
      sender: email.sender,
      sender_domain: email.sender_domain,
      rejection_type: rejectionType,
    }));
    await supabase.from('email_feedback').insert(feedbackRows);
    await dismiss(email.id);
  };

  return { emails, dismiss, sendFeedback, refetch: fetchEmails };
}

function useStats(taskCount: number, emailCount: number, hasRedEmail: boolean) {
  const [stats, setStats] = useState<Stats>({ tasks: taskCount, flags: 0, proposals: 0, emails: emailCount, hasRedEmail });

  useEffect(() => {
    setStats(prev => ({ ...prev, tasks: taskCount, emails: emailCount, hasRedEmail }));
  }, [taskCount, emailCount, hasRedEmail]);

  useEffect(() => {
    (async () => {
      const [flagsRes, propsRes] = await Promise.all([
        supabase.from('activity_log').select('id', { count: 'exact', head: true }),
        supabase.from('proposals').select('id', { count: 'exact', head: true }),
      ]);
      setStats(prev => ({
        ...prev,
        flags: flagsRes.count || 0,
        proposals: propsRes.count || 0,
      }));
    })();
  }, []);

  return stats;
}

// ─── Toast Component ───────────────────────────────────────
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="toast" style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: 'rgba(15,18,25,0.95)', border: '1px solid var(--accent-cyan)',
      padding: '10px 24px', fontFamily: 'var(--font-body)', color: 'var(--accent-cyan)',
      fontSize: 16, zIndex: 10000, clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
    }}>
      {message}
    </div>
  );
}

// ─── Run Button ────────────────────────────────────────────
function RunButton() {
  const [state, setState] = useState<'idle'|'running'|'done'>('idle');
  const handleClick = () => {
    if (state !== 'idle') return;
    setState('running');
    setTimeout(() => { setState('done'); setTimeout(() => setState('idle'), 2000); }, 1500);
  };
  return (
    <button className={`run-btn ${state}`} onClick={handleClick}>
      {state === 'idle' ? '▶ RUN' : state === 'running' ? '⟳ RUNNING...' : '✓ DONE'}
    </button>
  );
}

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="panel" style={{ textAlign: 'center', flex: 1, minWidth: 120, animation: 'statGlow 4s ease infinite' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color, lineHeight: 1 }}>{value}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// ─── Priority Inbox ────────────────────────────────────────
function PriorityInbox({ emails, onDismiss, onFeedback }: {
  emails: FlaggedEmail[];
  onDismiss: (id: string) => void;
  onFeedback: (email: FlaggedEmail, type: string) => void;
}) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (emails.length === 0) return null;

  const priorityBadge = (p: string) => p === 'red' ? '🔴' : p === 'yellow' ? '🟡' : '🟢';
  const priorityOrder = { red: 0, yellow: 1, green: 2 };
  const sorted = [...emails].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const ageColor = (date: string) => {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days >= 7) return 'var(--accent-red)';
    if (days >= 3) return 'var(--accent-amber)';
    return 'var(--text-muted)';
  };

  const feedbackOptions = [
    { label: 'Wrong priority', value: 'wrong_priority' },
    { label: 'Not relevant', value: 'not_relevant' },
    { label: 'Already handled', value: 'already_handled' },
    { label: 'Never flag these', value: 'never_flag' },
  ];

  return (
    <div className="panel" style={{ borderColor: 'rgba(255,0,255,0.2)' }}>
      <h3 style={{ fontSize: 16, color: 'var(--accent-magenta)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        📧 Priority Inbox ({emails.length})
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(email => (
          <div
            key={email.id}
            style={{
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
            }}
            onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.gmail_id}`, '_blank')}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-cyan)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <span style={{ marginRight: 8 }}>{priorityBadge(email.priority)}</span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>
                  {email.subject.length > 60 ? email.subject.slice(0, 60) + '…' : email.subject}
                </span>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 2 }}>{email.sender}</div>
              </div>
              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }} onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onDismiss(email.id)}
                  style={{
                    background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)',
                    padding: '6px 12px', minHeight: 32, minWidth: 32, cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-heading)',
                  }}
                  title="Dismiss"
                >✓</button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === email.id ? null : email.id)}
                    style={{
                      background: 'transparent', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)',
                      padding: '6px 12px', minHeight: 32, minWidth: 32, cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-heading)',
                    }}
                    title="Wrong call"
                  >👎</button>
                  {openDropdown === email.id && (
                    <div style={{
                      position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                      background: 'rgba(15,18,25,0.98)', border: '1px solid var(--accent-magenta)',
                      minWidth: 180, padding: 4,
                    }}>
                      {feedbackOptions.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => { onFeedback(email, opt.value); setOpenDropdown(null); }}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px',
                            background: 'transparent', border: 'none', color: 'var(--text-primary)',
                            cursor: 'pointer', fontSize: 15, fontFamily: 'var(--font-body)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,0,255,0.1)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >{opt.label}</button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Agent tags */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 6 }}>
              {email.agents.map((a, i) => {
                const slug = agentNameMap[a.agent];
                return (
                  <div key={i} style={{ fontSize: 16, color: 'var(--accent-cyan)' }}>
                    {slug ? (
                      <Link href={`/agent/${slug}`} style={{ color: 'var(--accent-magenta)', fontFamily: 'var(--font-heading)', textDecoration: 'none' }}>
                        {a.agent}:
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--accent-magenta)', fontFamily: 'var(--font-heading)' }}>{a.agent}:</span>
                    )}{' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{a.reason}</span>
                  </div>
                );
              })}
            </div>
            {/* Age */}
            <div style={{ fontSize: 14, color: ageColor(email.received_at) }}>
              Received: {new Date(email.received_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {timeAgo(email.received_at)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── HQ Tab ────────────────────────────────────────────────
function HQTab({ tasks, emails, stats, onDismiss, onFeedback }: {
  tasks: Task[];
  emails: FlaggedEmail[];
  stats: Stats;
  onDismiss: (id: string) => void;
  onFeedback: (email: FlaggedEmail, type: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Morning Brief */}
      <div className="panel" style={{ borderColor: 'rgba(0,255,255,0.3)' }}>
        <h2 style={{ fontSize: 16, color: 'var(--accent-cyan)', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
          Morning Brief
        </h2>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5 }}>
          Good morning, Commander. BASeD Command Center is online. {stats.tasks} standing orders loaded. All systems nominal.
          {stats.emails > 0
            ? ` ${stats.emails} email${stats.emails > 1 ? 's' : ''} flagged for your attention.`
            : ' The grid is quiet. Nothing needs your attention. Time to build.'}
        </p>
      </div>

      {/* Stat Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="Tasks" value={String(stats.tasks)} color="var(--accent-magenta)" />
        <StatCard label="Flags" value={String(stats.flags)} color="var(--accent-green)" />
        <StatCard label="Proposals" value={String(stats.proposals)} color="var(--accent-cyan)" />
        <StatCard label="Email" value={String(stats.emails)} color={stats.hasRedEmail ? 'var(--accent-amber)' : 'var(--accent-green)'} />
        <StatCard label="Cost" value="$0.00" color="var(--text-secondary)" />
      </div>

      {/* Agent Roster */}
      <div>
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Agent Roster
        </h3>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {agents.map(a => (
            <Link key={a.id} href={`/agent/${a.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="panel" style={{ minWidth: 140, textAlign: 'center', flex: '0 0 auto' }}>
                <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-magenta)' }}>
                  <Image src={a.avatar} alt={a.name} fill style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--accent-magenta)' }}>
                  {a.emoji} {a.name}
                </div>
                <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{a.role}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, fontSize: 14, color: a.status === 'active' ? 'var(--accent-green)' : a.status === 'activating' ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  {a.status === 'active' && <><span className="pulse-dot" /> Online</>}
                  {a.status === 'activating' && <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-amber)', boxShadow: '0 0 6px var(--accent-amber)' }} /> Activating</>}
                  {a.status === 'planned' && <><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)' }} /> Planned</>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="panel">
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Needs Attention
        </h3>
        <p style={{ margin: 0, color: 'var(--accent-green)', fontSize: 18 }}>✓ Nothing needs your attention</p>
      </div>

      {/* Priority Inbox — between Needs Attention and Next Up */}
      <PriorityInbox emails={emails} onDismiss={onDismiss} onFeedback={onFeedback} />

      {/* Next Up */}
      <div className="panel">
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Next Up
        </h3>
        {tasks.filter(t => t.frequency === 'Daily').slice(0, 5).map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>{t.name}</span>
            <span style={{ fontSize: 15, color: 'var(--text-muted)' }}>{t.nextRun || t.lastRun}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="panel">
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Recent Activity
        </h3>
        {[
          { time: "02:55", text: "Command Center v3 deployed", agent: "Dezayas" },
          { time: "02:37", text: "Asset picks confirmed", agent: "Wesley" },
          { time: "02:15", text: "Gamification spec delivered", agent: "Cid" },
          { time: "01:50", text: "Architecture spec v3 finalized", agent: "Astra" },
          { time: "01:30", text: "Logo synthwave variants generated", agent: "Romero" },
          { time: "01:00", text: "Build brief compiled", agent: "Ace" },
          { time: "00:45", text: "Agent avatars approved", agent: "Wesley" },
          { time: "00:20", text: "Standing orders migrated", agent: "Anderson" },
        ].map((e, i) => {
          const slug = agentNameMap[e.agent];
          return (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 16 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 50 }}>{e.time}</span>
              {slug ? (
                <Link href={`/agent/${slug}`} style={{ color: 'var(--accent-cyan)', minWidth: 80, textDecoration: 'none' }}>{e.agent}</Link>
              ) : (
                <span style={{ color: 'var(--accent-cyan)', minWidth: 80 }}>{e.agent}</span>
              )}
              <span>{e.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Ops Tab (Kanban) ──────────────────────────────────────
function OpsTab({ tasks }: { tasks: Task[] }) {
  const freqs: Task['frequency'][] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];
  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, minHeight: 400 }}>
      {freqs.map(freq => {
        const col = tasks.filter(t => t.frequency === freq);
        return (
          <div key={freq} style={{ minWidth: 260, flex: '0 0 260px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, color: 'var(--accent-magenta)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {freq} <span style={{ color: 'var(--text-muted)' }}>({col.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.map(t => (
                <div key={t.id} className="panel" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, lineHeight: 1.3 }}>{t.name}</div>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                      background: t.health === 'green' ? 'var(--accent-green)' : t.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-red)',
                      boxShadow: `0 0 6px ${t.health === 'green' ? 'var(--accent-green)' : t.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-red)'}`
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, color: 'var(--accent-cyan)', fontFamily: 'var(--font-body)' }}>{t.project}</span>
                    <RunButton />
                  </div>
                  <div style={{ fontSize: 15, color: 'var(--text-muted)', marginTop: 4 }}>Last: {t.lastRun}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Intel Tab ─────────────────────────────────────────────
function IntelTab() {
  return <EntityManagement />;
}

// ─── Apps Tab ──────────────────────────────────────────────
function AppsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {categories.map(cat => (
        <div key={cat.name}>
          <h3 style={{ fontSize: 16, color: 'var(--accent-magenta)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {cat.emoji} {cat.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {cat.apps.map(app => (
              <a key={app.name} href={app.url || '#'} target="_blank" rel="noopener" className="panel" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{app.icon} {app.name}</span>
                  <span style={{
                    fontSize: 14, fontFamily: 'var(--font-heading)', letterSpacing: '0.04em', padding: '4px 10px',
                    border: `1px solid ${app.status === 'ONLINE' ? 'var(--accent-green)' : app.status === 'IN PROGRESS' ? 'var(--accent-amber)' : 'var(--text-muted)'}`,
                    color: app.status === 'ONLINE' ? 'var(--accent-green)' : app.status === 'IN PROGRESS' ? 'var(--accent-amber)' : 'var(--text-muted)',
                  }}>
                    {app.status}
                  </span>
                </div>
                <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{app.description}</div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chat Tab ──────────────────────────────────────────────
function ChatTab() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="panel" style={{ textAlign: 'center', padding: 48, maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
        <h2 style={{ fontSize: 20, color: 'var(--accent-cyan)', margin: '0 0 12px 0' }}>Chat with BASeD</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>
          Coming soon. Use the command bar below for now.
        </p>
      </div>
    </div>
  );
}

// ─── Main App ──────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState("hq");
  const [command, setCommand] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const { tasks } = useSupabaseTasks();
  const { emails, dismiss, sendFeedback } = useFlaggedEmails();
  const hasRedEmail = emails.some(e => e.priority === 'red');
  const stats = useStats(tasks.length, emails.length, hasRedEmail);

  const handleCommand = useCallback(() => {
    if (!command.trim()) return;
    setToast(`> ${command}`);
    setCommand("");
  }, [command]);

  const tabContent: Record<string, React.ReactNode> = {
    hq: <HQTab tasks={tasks} emails={emails} stats={stats} onDismiss={dismiss} onFeedback={sendFeedback} />,
    ops: <OpsTab tasks={tasks} />,
    intel: <IntelTab />,
    apps: <AppsTab />,
    chat: <ChatTab />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid rgba(255,0,255,0.15)',
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo.png" alt="BASeD" width={40} height={40} style={{ borderRadius: 4 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, letterSpacing: '0.1em' }}>
              <span className="neon-magenta">BASeD</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>COMMAND CENTER</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
              v3.0 — ALL SYSTEMS NOMINAL <span className="pulse-dot" style={{ marginLeft: 6 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--accent-amber)' }}>🔥 1</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Lv.1 Operator · 0 XP
            <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.1)', marginTop: 2, borderRadius: 2 }}>
              <div style={{
                width: '5%', height: '100%', background: 'linear-gradient(90deg, var(--accent-magenta), var(--accent-cyan))',
                borderRadius: 2, backgroundSize: '200px 100%', animation: 'xpShimmer 2s linear infinite'
              }} />
            </div>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <nav style={{
        display: 'flex', justifyContent: 'center', gap: 4,
        borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,10,10,0.6)'
      }}>
        {tabs.map(t => (
          <button key={t.id} className={`tab-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {tabContent[activeTab]}
      </main>

      {/* Command Bar */}
      <div style={{
        position: 'sticky', bottom: 0, zIndex: 100,
        borderTop: '1px solid rgba(255,0,255,0.2)',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ color: 'var(--accent-magenta)', fontFamily: 'var(--font-body)', fontSize: 18 }}>&gt; _</span>
        <input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCommand()}
          placeholder="Type a command..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 18,
            caretColor: 'var(--accent-cyan)'
          }}
        />
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
