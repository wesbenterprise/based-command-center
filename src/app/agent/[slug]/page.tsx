import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { agents, agentMap } from "../../../data/agents";
import { tasks } from "../../../data/tasks";
import AgentHero from "../../../components/agents/AgentHero";
import AgentStats from "../../../components/agents/AgentStats";
import AgentIdentity from "../../../components/agents/AgentIdentity";
import AgentRelationships from "../../../components/agents/AgentRelationships";
import AgentActivity from "../../../components/agents/AgentActivity";
import AgentStandingOrders from "../../../components/agents/AgentStandingOrders";
import AgentCapabilities from "../../../components/agents/AgentCapabilities";

const tabs = [
  { id: "hq", label: "HQ", icon: "🏠" },
  { id: "ops", label: "Ops", icon: "⚡" },
  { id: "intel", label: "Intel", icon: "📊" },
  { id: "apps", label: "Apps", icon: "🧩" },
  { id: "chat", label: "Chat", icon: "💬" },
];

export default function AgentProfilePage({ params }: { params: { slug: string } }) {
  const agent = agentMap[params.slug];
  if (!agent) return notFound();

  const assignedTasks = tasks.filter(t => t.assignedAgent === agent.id);

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
          <Link key={t.id} href="/" className="tab-btn" style={{ textDecoration: 'none' }}>
            {t.icon} {t.label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main style={{ flex: 1, padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-heading)' }}>
          ← Back to HQ
        </Link>

        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AgentHero agent={agent} />
          <AgentStats taskCount={assignedTasks.length} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <AgentIdentity agent={agent} />
              <AgentRelationships agent={agent} agents={agents} />
            </div>
            <AgentActivity agent={agent} agents={agents} />
          </div>
          <AgentStandingOrders tasks={assignedTasks} />
          <AgentCapabilities agent={agent} />
        </div>
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
          placeholder="Type a command..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 18,
            caretColor: 'var(--accent-cyan)'
          }}
        />
      </div>
    </div>
  );
}
