import Link from 'next/link';

export default function AgentStats({ taskCount, deliverableCount, agentId }: { taskCount: number; deliverableCount?: number; agentId?: string }) {
  const stat = (label: string, value: string, color: string, href?: string) => (
    <div className="panel" style={{ textAlign: 'center', flex: 1, minWidth: 140, animation: 'statGlow 4s ease infinite' }}>
      {href ? (
        <Link href={href} style={{ textDecoration: 'none' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color, lineHeight: 1 }}>{value}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
        </Link>
      ) : (
        <>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, color, lineHeight: 1 }}>{value}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 6, fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {stat('Tasks Owned', String(taskCount), 'var(--accent-cyan)')}
      {stat('Deliverables', deliverableCount !== undefined ? String(deliverableCount) : '—', 'var(--accent-magenta)', agentId ? `/output?agent=${agentId}` : undefined)}
      {stat('Sessions Today', '—', 'var(--text-muted)')}
      {stat('Cost (7d)', '—', 'var(--text-muted)')}
      {stat('Last Active', '—', 'var(--text-muted)')}
    </div>
  );
}
