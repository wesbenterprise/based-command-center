"use client";

import { useState, useCallback, useEffect } from "react";
import { categories } from "../apps.config";
import { tasks, Task } from "../data/tasks";
import Image from "next/image";

// ─── Agents ────────────────────────────────────────────────
const agents = [
  { id: "ace", name: "Ace", emoji: "♠️", role: "Chief of Staff", avatar: "/assets/avatars/ace.png" },
  { id: "astra", name: "Astra", emoji: "🔮", role: "Strategist", avatar: "/assets/avatars/astra.png" },
  { id: "dezayas", name: "Dezayas", emoji: "🔧", role: "Builder", avatar: "/assets/avatars/dezayas.png" },
  { id: "rybo", name: "Rybo", emoji: "🃏", role: "Storyteller", avatar: "/assets/avatars/rybo.png" },
  { id: "charles", name: "Charles", emoji: "📜", role: "Historian", avatar: "/assets/avatars/charles.png" },
];

// ─── Tab Definitions ───────────────────────────────────────
const tabs = [
  { id: "hq", label: "HQ", icon: "🏠" },
  { id: "ops", label: "Ops", icon: "⚡" },
  { id: "intel", label: "Intel", icon: "📊" },
  { id: "apps", label: "Apps", icon: "🧩" },
  { id: "chat", label: "Chat", icon: "💬" },
];

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
      <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// ─── HQ Tab ────────────────────────────────────────────────
function HQTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Morning Brief */}
      <div className="panel" style={{ borderColor: 'rgba(0,255,255,0.3)' }}>
        <h2 style={{ fontSize: 14, color: 'var(--accent-cyan)', margin: '0 0 12px 0', textTransform: 'uppercase' }}>
          Morning Brief
        </h2>
        <p style={{ margin: 0, fontSize: 20, lineHeight: 1.5 }}>
          Good morning, Commander. BASeD Command Center is online. 24 standing orders loaded. All systems nominal.
          The grid is quiet. Nothing needs your attention. Time to build.
        </p>
      </div>

      {/* Stat Row */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <StatCard label="Tasks" value="24" color="var(--accent-magenta)" />
        <StatCard label="Flags" value="0" color="var(--accent-green)" />
        <StatCard label="Proposals" value="0" color="var(--accent-cyan)" />
        <StatCard label="Email" value="0" color="var(--accent-amber)" />
        <StatCard label="Cost" value="$0.00" color="var(--text-secondary)" />
      </div>

      {/* Agent Roster */}
      <div>
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Agent Roster
        </h3>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {agents.map(a => (
            <div key={a.id} className="panel" style={{ minWidth: 140, textAlign: 'center', flex: '0 0 auto' }}>
              <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 8px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent-magenta)' }}>
                <Image src={a.avatar} alt={a.name} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--accent-magenta)' }}>
                {a.emoji} {a.name}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{a.role}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6, fontSize: 13, color: 'var(--accent-green)' }}>
                <span className="pulse-dot" /> Online
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Needs Attention */}
      <div className="panel">
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Needs Attention
        </h3>
        <p style={{ margin: 0, color: 'var(--accent-green)', fontSize: 18 }}>✓ Nothing needs your attention</p>
      </div>

      {/* Next Up */}
      <div className="panel">
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Next Up
        </h3>
        {tasks.filter(t => t.frequency === 'Daily').slice(0, 5).map(t => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span>{t.name}</span>
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t.nextRun}</span>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="panel">
        <h3 style={{ fontSize: 12, color: 'var(--text-muted)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
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
        ].map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '4px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 16 }}>
            <span style={{ color: 'var(--text-muted)', minWidth: 50 }}>{e.time}</span>
            <span style={{ color: 'var(--accent-cyan)', minWidth: 80 }}>{e.agent}</span>
            <span>{e.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Ops Tab (Kanban) ──────────────────────────────────────
function OpsTab() {
  const freqs: Task['frequency'][] = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual'];
  return (
    <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16, minHeight: 400 }}>
      {freqs.map(freq => {
        const col = tasks.filter(t => t.frequency === freq);
        return (
          <div key={freq} style={{ minWidth: 260, flex: '0 0 260px' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 13, color: 'var(--accent-magenta)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {freq} <span style={{ color: 'var(--text-muted)' }}>({col.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {col.map(t => (
                <div key={t.id} className="panel" style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, lineHeight: 1.3 }}>{t.name}</div>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                      background: t.health === 'green' ? 'var(--accent-green)' : t.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-red)',
                      boxShadow: `0 0 6px ${t.health === 'green' ? 'var(--accent-green)' : t.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-red)'}`
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--accent-cyan)', fontFamily: 'var(--font-body)' }}>{t.project}</span>
                    <RunButton />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Last: {t.lastRun}</div>
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
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
      <div className="panel" style={{ textAlign: 'center', padding: 48, maxWidth: 500 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h2 style={{ fontSize: 20, color: 'var(--accent-cyan)', margin: '0 0 12px 0' }}>Intel — Coming Soon</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, margin: 0 }}>
          Weekly scorecards, market intelligence, competitive analysis, and KPI dashboards.
          Phase 2 of the Command Center rollout.
        </p>
      </div>
    </div>
  );
}

// ─── Apps Tab ──────────────────────────────────────────────
function AppsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {categories.map(cat => (
        <div key={cat.name}>
          <h3 style={{ fontSize: 13, color: 'var(--accent-magenta)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {cat.emoji} {cat.name}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {cat.apps.map(app => (
              <a key={app.name} href={app.url || '#'} target="_blank" rel="noopener" className="panel" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 13 }}>{app.icon} {app.name}</span>
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', padding: '2px 8px',
                    border: `1px solid ${app.status === 'ONLINE' ? 'var(--accent-green)' : app.status === 'IN PROGRESS' ? 'var(--accent-amber)' : 'var(--text-muted)'}`,
                    color: app.status === 'ONLINE' ? 'var(--accent-green)' : app.status === 'IN PROGRESS' ? 'var(--accent-amber)' : 'var(--text-muted)',
                  }}>
                    {app.status}
                  </span>
                </div>
                <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{app.description}</div>
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

  const handleCommand = useCallback(() => {
    if (!command.trim()) return;
    setToast(`> ${command}`);
    setCommand("");
  }, [command]);

  const tabContent: Record<string, React.ReactNode> = {
    hq: <HQTab />,
    ops: <OpsTab />,
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
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, letterSpacing: '0.15em' }}>
              <span className="neon-magenta">BASeD</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>COMMAND CENTER</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
              v3.0 — ALL SYSTEMS NOMINAL <span className="pulse-dot" style={{ marginLeft: 6 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--accent-amber)' }}>🔥 1</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
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
        padding: '8px 24px', display: 'flex', alignItems: 'center', gap: 8
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
