import Link from "next/link";
import { Agent, AgentRelationship } from "../../data/agents";

const typeLabel: Record<AgentRelationship['type'], string> = {
  reports_to: 'Reports to',
  works_with: 'Works with',
  dispatches_to: 'Dispatches to',
  receives_from: 'Receives from',
};

export default function AgentRelationships({ agent, agents }: { agent: Agent; agents: Agent[] }) {
  const known = new Set(agents.map(a => a.id));
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        Relationships
      </div>
      {agent.relationships.map((rel, idx) => (
        <div key={`${rel.targetAgent}-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{typeLabel[rel.type]}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {known.has(rel.targetAgent) ? (
              <Link href={`/agent/${rel.targetAgent}`} style={{ color: 'var(--accent-magenta)', fontFamily: 'var(--font-heading)', textDecoration: 'none' }}>
                {agents.find(a => a.id === rel.targetAgent)?.name}
              </Link>
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>{rel.targetAgent}</span>
            )}
            <span style={{ color: 'var(--text-secondary)' }}>{rel.description}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
