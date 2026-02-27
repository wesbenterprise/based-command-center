import { Agent } from "../../data/agents";

export default function AgentCapabilities({ agent }: { agent: Agent }) {
  const isPlanned = agent.status === 'planned';
  return (
    <div className="panel">
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
        Capabilities & Tools
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {agent.tools.map((tool) => (
          <span
            key={tool}
            style={{
              padding: '6px 12px',
              border: `1px ${isPlanned ? 'dashed' : 'solid'} ${isPlanned ? 'var(--text-muted)' : 'var(--accent-cyan)'}`,
              color: isPlanned ? 'var(--text-muted)' : 'var(--accent-cyan)',
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
}
