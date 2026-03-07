"use client";

import { useState, useEffect } from "react";
import { agents } from "../data/agents";
import { supabase } from "../lib/supabase";
import { formatCost } from "../lib/format";
import Image from "next/image";
import Link from "next/link";
import MorningBrief from "../components/standup/MorningBrief";
import NeedsAttention from "../components/alerts/NeedsAttention";
import { Task, tasks as fallbackTasks } from "../data/tasks";

// ─── Idle Time Helper ──────────────────────────────────────
function formatIdleTime(lastActive?: string): string | null {
  if (!lastActive) return null;
  const diff = Date.now() - new Date(lastActive).getTime();
  if (diff < 0) return null;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
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

// ─── Hooks ─────────────────────────────────────────────────
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
  tasks: number;
  flags: number;
  proposals: number;
  cost: number;
}

function useStats(taskCount: number) {
  const [stats, setStats] = useState<Stats>({ tasks: taskCount, flags: 0, proposals: 0, cost: 0 });

  useEffect(() => {
    setStats(prev => ({ ...prev, tasks: taskCount }));
  }, [taskCount]);

  useEffect(() => {
    (async () => {
      const [flagsRes, propsRes, costRes] = await Promise.all([
        supabase.from('activity_log').select('id', { count: 'exact', head: true }),
        supabase.from('proposals').select('id', { count: 'exact', head: true }),
        fetch('/api/token-usage?range=30d').then(r => r.json()).catch(() => []),
      ]);
      const totalCost = Array.isArray(costRes) ? costRes.reduce((sum: number, r: { cost_usd?: number }) => sum + (r.cost_usd || 0), 0) : 0;
      setStats(prev => ({
        ...prev,
        flags: flagsRes.count || 0,
        proposals: propsRes.count || 0,
        cost: totalCost,
      }));
    })();
  }, []);

  return stats;
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

// ─── Main Page (HQ) ────────────────────────────────────────
export default function Home() {
  const { tasks } = useSupabaseTasks();
  const stats = useStats(tasks.length);
  const heartbeats = useAgentHeartbeats();

  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <MorningBrief />

        {/* Stat Row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <StatCard label="Tasks" value={String(stats.tasks)} color="var(--accent-magenta)" />
          <StatCard label="Flags" value={String(stats.flags)} color="var(--accent-green)" />
          <StatCard label="Proposals" value={String(stats.proposals)} color="var(--accent-cyan)" />
          <StatCard label="Cost (30d)" value={formatCost(stats.cost)} color="var(--text-secondary)" />
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
                  {(() => {
                    const hb = heartbeats[a.id] || a.lastActive;
                    if (hb) return (
                      <div style={{ marginTop: 4, fontSize: 12, color: idleColor(hb), fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>
                        idle: {formatIdleTime(hb)}
                      </div>
                    );
                    if (a.status !== 'planned') return (
                      <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.02em' }}>
                        idle: never used
                      </div>
                    );
                    return null;
                  })()}
                </div>
              </Link>
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
