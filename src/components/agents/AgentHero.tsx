import Image from "next/image";
import { Agent } from "../../data/agents";

const statusLabel = (status: Agent['status']) => {
  if (status === 'planned') return { label: 'Planned', color: 'var(--text-muted)', dot: 'var(--text-muted)' };
  if (status === 'activating') return { label: 'Activating', color: 'var(--accent-amber)', dot: 'var(--accent-amber)' };
  return { label: 'Online', color: 'var(--accent-green)', dot: 'var(--accent-green)' };
};

export default function AgentHero({ agent }: { agent: Agent }) {
  const status = statusLabel(agent.status);
  return (
    <div className="panel" style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
      <div
        style={{
          position: 'relative',
          width: 120,
          height: 120,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '2px solid var(--accent-magenta)',
          boxShadow: '0 0 16px rgba(255,0,255,0.3)',
          flexShrink: 0,
          transition: 'transform 0.3s, box-shadow 0.3s',
        }}
      >
        <Image src={agent.avatar} alt={agent.name} fill style={{ objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 200 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 600 }} className="neon-magenta">
          {agent.name} {agent.emoji}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, color: 'var(--text-secondary)' }}>{agent.role}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            padding: '4px 10px',
            border: '1px solid var(--accent-cyan)',
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            color: 'var(--accent-cyan)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            {agent.model}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: status.color, fontSize: 14 }}>
            {agent.status === 'active' && <span className="pulse-dot" />}
            {agent.status !== 'active' && (
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.dot, boxShadow: `0 0 6px ${status.dot}` }} />
            )}
            {status.label}
          </span>
        </div>
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Uptime</div>
          <div style={{ width: 220, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 4, marginTop: 6, overflow: 'hidden' }}>
            <div style={{ width: agent.status === 'planned' ? '10%' : '85%', height: '100%', background: 'linear-gradient(90deg, var(--accent-magenta), var(--accent-cyan))' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
