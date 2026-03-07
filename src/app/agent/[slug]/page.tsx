import Link from "next/link";
import { notFound } from "next/navigation";
import { agents, agentMap } from "../../../data/agents";
import { tasks } from "../../../data/tasks";
import { deliverables } from "../../../data/deliverables";
import AgentHero from "../../../components/agents/AgentHero";
import AgentStats from "../../../components/agents/AgentStats";
import AgentIdentity from "../../../components/agents/AgentIdentity";
import AgentRelationships from "../../../components/agents/AgentRelationships";
import AgentActivity from "../../../components/agents/AgentActivity";
import AgentStandingOrders from "../../../components/agents/AgentStandingOrders";
import AgentCapabilities from "../../../components/agents/AgentCapabilities";
import AgentModelConfig from "../../../components/agents/AgentModelConfig";

export function generateStaticParams() {
  return agents.map((agent) => ({ slug: agent.id }));
}

export default async function AgentProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = agentMap[slug];
  if (!agent) return notFound();

  const assignedTasks = tasks.filter(t => t.assignedAgent === agent.id);
  const deliverableCount = deliverables.filter(d => d.agentId === agent.id).length;

  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-heading)' }}>
        ← Back to HQ
      </Link>

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <AgentHero agent={agent} />
        <AgentStats taskCount={assignedTasks.length} deliverableCount={deliverableCount} agentId={agent.id} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <AgentIdentity agent={agent} />
            <AgentRelationships agent={agent} agents={agents} />
          </div>
          <AgentActivity agent={agent} agents={agents} />
        </div>
        <AgentModelConfig agentId={agent.id} staticModel={agent.model} />
        <AgentStandingOrders tasks={assignedTasks} />
        <AgentCapabilities agent={agent} />
      </div>
    </main>
  );
}
