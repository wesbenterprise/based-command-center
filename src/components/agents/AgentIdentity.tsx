import { Agent } from "../../data/agents";

export default function AgentIdentity({ agent }: { agent: Agent }) {
  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
          Identity & Voice
        </div>
        <div style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{agent.personalityBrief}</div>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          What They Do
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {agent.capabilities.map((cap, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)' }}>{cap}</li>
          ))}
        </ul>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
          What They Don’t Do
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {agent.boundaries.map((cap, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)' }}>{cap}</li>
          ))}
        </ul>
      </div>
      {agent.voiceSample && (
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
            Voice Sample
          </div>
          <div style={{ fontSize: 18, color: 'var(--accent-cyan)' }}>{agent.voiceSample}</div>
        </div>
      )}
    </div>
  );
}
