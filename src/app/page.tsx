"use client";

import { useState, useEffect } from "react";
import { agents } from "../data/agents";
import { supabase } from "../lib/supabase";
import { formatCost } from "../lib/format";
import { gatewayFetch } from "../lib/gateway";
import Image from "next/image";
import Link from "next/link";
import MorningBrief from "../components/standup/MorningBrief";
import NeedsAttention from "../components/alerts/NeedsAttention";
import { Task, tasks as fallbackTasks } from "../data/tasks";
import OpsPulse from "../components/OpsPulse";
import ExecApprovals from "../components/ExecApprovals";

// ─── Idle Time Helpers ──────────────────────────────────────
function formatIdleTime(lastActive?: string): string | null {
  if (!lastActive) return null;
  const diff = Date.now() - new Date(lastActive).getTime();
  if (diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function relativeTimeFull(lastActive?: string): string {
  if (!lastActive) return '';
  const d = new Date(lastActive);
  const rel = formatIdleTime(lastActive) || '';
  const abs = d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return `${rel} (${abs})`;
}

function idleColor(lastActive?: string): string {
  if (!lastActive) return 'var(--text-muted)';
  const diff = Date.now() - new Date(lastActive).getTime();
  const hrs = diff / 3600000;
  if (hrs < 1) return 'var(--accent-green)';
  if (hrs < 12) return 'var(--accent-cyan)';
  if (hrs < 48) return 'var(--accent-amber)';
  return 'var(--text-muted)';
}

function modelBadgeClass(model: string): string {
  const m = model.toLowerCase();
  if (m.includes('opus')) return 'model-badge model-opus';
  if (m.includes('sonnet')) return 'model-badge model-sonnet';
  if (m.includes('flash')) return 'model-badge model-flash';
  if (m.includes('gpt')) return 'model-badge model-gpt';
  if (m.includes('gemini')) return 'model-badge model-gemini';
  return 'model-badge model-default';
}

function modelShortName(model: string): string {
  if (model.toLowerCase().includes('opus 4')) return 'Opus 4';
  if (model.toLowerCase().includes('sonnet 4')) return 'Sonnet 4';
  if (model.toLowerCase().includes('flash')) return 'Flash';
  if (model.toLowerCase().includes('gpt-5')) return 'GPT-5';
  if (model.toLowerCase().includes('gemini')) return 'Gemini';
  if (model === 'TBD') return 'TBD';
  return model.split(' ').slice(-2).join(' ');
}

// ─── Hooks ──────────────────────────────────────────────────
function useAgentHeartbeats() {
  const [heartbeats, setHeartbeats] = useState<Record<string, string>>({});
  useEffect(() => {
    const fetchHeartbeats = () => {
      fetch('/api/heartbeats')
        .then(r => r.json())
        .then(data => { if (!data.error) setHeartbeats(data); })
        .catch(() => {});
    };
    fetchHeartbeats();
    const interval = setInterval(fetchHeartbeats, 60000);
    return () => clearInterval(interval);
  }, []);
  return heartbeats;
}

interface LiveSession {
  agentId: string;
  status: 'live' | 'recent' | 'idle' | 'dormant';
  sessionCount: number;
  lastActiveMs: number;
  lastActiveMinAgo: number;
  model: string;
  channel: string;
}

function useLiveSessions() {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  useEffect(() => {
    const fetchSessions = () => {
      fetch('/api/gateway/sessions')
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setSessions(data); })
        .catch(() => {});
    };
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);
  return sessions;
}

function useSupabaseTasks() {
  const [tasks, setTasks] = useState<Task[]>(fallbackTasks);
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
    })();
  }, []);
  return { tasks };
}

interface Stats {
  crons: number;
  flags: number;
  proposals: number;
  cost: number;
}

function useStats() {
  const [stats, setStats] = useState<Stats>({ crons: 0, flags: 0, proposals: 0, cost: 0 });
  useEffect(() => {
    (async () => {
      const [cronRes, flagsRes, propsRes, costRes] = await Promise.all([
        gatewayFetch<{ jobs: any[] } | any[]>('/api/cron').then(data => Array.isArray(data) ? data : (data?.jobs ?? [])).catch(() => []),
        supabase.from('activity_log').select('id', { count: 'exact', head: true }),
        supabase.from('proposals').select('id', { count: 'exact', head: true }),
        fetch('/api/token-usage?range=30d').then(r => r.json()).catch(() => []),
      ]);
      const totalCost = Array.isArray(costRes) ? costRes.reduce((sum: number, r: { cost_usd?: number }) => sum + (r.cost_usd || 0), 0) : 0;
      setStats({
        crons: Array.isArray(cronRes) ? cronRes.length : 0,
        flags: flagsRes.count || 0,
        proposals: propsRes.count || 0,
        cost: totalCost,
      });
    })();
  }, []);
  return stats;
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ label, value, color, href }: { label: string; value: string; color: string; href: string }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 120 }}>
      <div className="panel stat-card-link" style={{ textAlign: 'center', animation: 'statGlow 4s ease infinite', cursor: 'pointer', transition: 'filter 0.2s, border-color 0.2s' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color, lineHeight: 1 }}>{value}</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
      </div>
    </Link>
  );
}

// ─── Enhanced Agent Card ──────────────────────────────────────
function AgentCard({ agent, heartbeat, liveSession }: { agent: typeof agents[0]; heartbeat?: string; liveSession?: LiveSession }) {
  // Use live session data if available, fallback to heartbeat/static
  const lastActive = liveSession?.lastActiveMs
    ? new Date(liveSession.lastActiveMs).toISOString()
    : heartbeat || agent.lastActive;
  const color = idleColor(lastActive);

  const liveStatus = liveSession?.status;
  const statusColor = liveStatus === 'live'
    ? '#34D399'
    : liveStatus === 'recent'
    ? 'var(--accent-amber)'
    : agent.status === 'active'
    ? 'var(--accent-green)'
    : agent.status === 'activating'
    ? 'var(--accent-amber)'
    : 'var(--text-muted)';
  
  const statusLabel = liveStatus === 'live' ? 'Online'
    : liveStatus === 'recent' ? 'Recent'
    : liveStatus === 'idle' ? 'Idle'
    : agent.status === 'active' ? 'Online' : agent.status;

  return (
    <div onClick={() => window.location.href = `/agent/${agent.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: '0 0 auto', cursor: 'pointer' }}>
      <div className="panel agent-card-enhanced" style={{
        minWidth: 170,
        maxWidth: 200,
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        height: '100%',
      }}>
        {/* Avatar + Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ position: 'relative', width: 52, height: 52 }}>
            <div style={{
              width: 52, height: 52,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `2px solid ${statusColor}`,
              boxShadow: agent.status === 'active' ? `0 0 10px ${statusColor}40` : 'none',
            }}>
              <Image src={agent.avatar} alt={agent.name} width={52} height={52} style={{ objectFit: 'cover', display: 'block' }} />
            </div>
          </div>
          {/* Model badge */}
          <span className={modelBadgeClass(agent.model)}>
            {modelShortName(agent.model)}
          </span>
        </div>

        {/* Name + Role */}
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>{agent.emoji}</span>
            <span>{agent.name}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{agent.role}</div>
        </div>

        {/* Status + Last Active */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
          <span style={{
            width: 7, height: 7,
            borderRadius: '50%',
            background: statusColor,
            display: 'inline-block',
            boxShadow: `0 0 5px ${statusColor}`,
            flexShrink: 0,
          }} />
          <span style={{ color: statusColor, fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}>
            {statusLabel}
          </span>
        </div>

        {/* Last active time */}
        {lastActive && (
          <div style={{ fontSize: 11, color, fontFamily: 'var(--font-body)' }} title={relativeTimeFull(lastActive)}>
            {formatIdleTime(lastActive)}
          </div>
        )}

        {/* Skills tags */}
        {agent.tools.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
            {agent.tools.slice(0, 3).map(tool => (
              <span key={tool} style={{
                fontSize: 10,
                padding: '1px 5px',
                background: 'rgba(0,255,255,0.08)',
                border: '1px solid rgba(0,255,255,0.2)',
                borderRadius: 2,
                color: 'var(--accent-cyan)',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.03em',
                whiteSpace: 'nowrap',
              }}>
                {tool}
              </span>
            ))}
            {agent.tools.length > 3 && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>+{agent.tools.length - 3}</span>
            )}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
          <Link href={`/chat?agent=${agent.id}`} onClick={e => e.stopPropagation()} style={{
            flex: 1, textAlign: 'center', fontSize: 10,
            padding: '4px 0',
            background: 'rgba(255,0,255,0.08)',
            border: '1px solid rgba(255,0,255,0.25)',
            borderRadius: 3,
            color: 'var(--accent-magenta)',
            textDecoration: 'none',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
          }}>
            CHAT
          </Link>
          <Link href={`/agent/${agent.id}`} onClick={e => e.stopPropagation()} style={{
            flex: 1, textAlign: 'center', fontSize: 10,
            padding: '4px 0',
            background: 'rgba(0,255,255,0.05)',
            border: '1px solid rgba(0,255,255,0.2)',
            borderRadius: 3,
            color: 'var(--accent-cyan)',
            textDecoration: 'none',
            fontFamily: 'var(--font-heading)',
            letterSpacing: '0.04em',
          }}>
            PROFILE
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Fleet Status Summary ────────────────────────────────────
function FleetSummary({ heartbeats }: { heartbeats: Record<string, string> }) {
  const active = agents.filter(a => a.status === 'active').length;
  const activating = agents.filter(a => a.status === 'activating').length;
  const planned = agents.filter(a => a.status === 'planned').length;
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', fontSize: 13, fontFamily: 'var(--font-heading)' }}>
      <span style={{ color: 'var(--accent-green)', letterSpacing: '0.05em' }}>
        <span style={{ fontSize: 16 }}>●</span> {active} active
      </span>
      {activating > 0 && (
        <span style={{ color: 'var(--accent-amber)', letterSpacing: '0.05em' }}>
          <span style={{ fontSize: 16 }}>◑</span> {activating} activating
        </span>
      )}
      <span style={{ color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
        <span style={{ fontSize: 16 }}>○</span> {planned} planned
      </span>
    </div>
  );
}

// ─── Main Page (HQ) ──────────────────────────────────────────
export default function Home() {
  const { tasks } = useSupabaseTasks();
  const stats = useStats();
  const heartbeats = useAgentHeartbeats();
  const liveSessions = useLiveSessions();

  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <MorningBrief />

        {/* Stat Row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="CRONs" value={String(stats.crons)} color="var(--accent-magenta)" href="/cron" />
          <StatCard label="Flags" value={String(stats.flags)} color="var(--accent-green)" href="/intel" />
          <StatCard label="Proposals" value={String(stats.proposals)} color="var(--accent-cyan)" href="/output" />
          <StatCard label="Cost (30d)" value={formatCost(stats.cost)} color="var(--text-secondary)" href="/system" />
        </div>

        {/* ─── OPS PULSE HERO ─── */}
        <OpsPulse heartbeats={heartbeats} liveSessions={liveSessions} />

        {/* ─── EXEC APPROVALS ─── */}
        <ExecApprovals />

        {/* ─── Agent Fleet ─── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Agent Fleet
            </h3>
            <FleetSummary heartbeats={heartbeats} />
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {agents.map(a => (
              <AgentCard key={a.id} agent={a} heartbeat={heartbeats[a.id]} liveSession={liveSessions.find(s => s.agentId === a.id)} />
            ))}
          </div>
        </div>

        <NeedsAttention />

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
      </div>
    </main>
  );
}
