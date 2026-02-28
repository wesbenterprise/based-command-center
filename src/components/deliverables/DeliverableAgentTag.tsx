import Image from 'next/image';
import Link from 'next/link';
import { agents } from '@/data/agents';

export default function DeliverableAgentTag({ agentId }: { agentId: string }) {
  const agent = agents.find(a => a.id === agentId);

  if (!agent) {
    return (
      <span style={{ fontFamily: 'var(--font-heading)', color: 'var(--accent-magenta)' }}>
        {agentId}
      </span>
    );
  }

  return (
    <Link
      href={`/agent/${agent.id}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        color: 'var(--accent-magenta)',
        fontFamily: 'var(--font-heading)',
        fontSize: 14,
      }}
    >
      <span
        style={{
          position: 'relative',
          width: 24,
          height: 24,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '1px solid var(--accent-magenta)',
        }}
      >
        {agent.avatar ? (
          <Image src={agent.avatar} alt={agent.name} fill style={{ objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 16 }}>{agent.emoji}</span>
        )}
      </span>
      <span>{agent.name}</span>
    </Link>
  );
}
