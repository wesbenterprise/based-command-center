import Link from "next/link";
import { ActivityEntry, Agent } from "../../data/agents";

const typeStyles: Record<ActivityEntry['type'], { icon: string; color: string }> = {
  task_completed: { icon: '✓', color: 'var(--accent-green)' },
  task_started: { icon: '▶', color: 'var(--accent-cyan)' },
  dispatch_sent: { icon: '→', color: 'var(--accent-magenta)' },
  dispatch_received: { icon: '←', color: 'var(--accent-magenta)' },
  flag: { icon: '⚠', color: 'var(--accent-amber)' },
  error: { icon: '✗', color: 'var(--accent-red)' },
  message: { icon: '💬', color: 'var(--text-secondary)' },
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

export default function AgentActivity({ agent, agents }: { agent: Agent; agents: Agent[] }) {
  if (agent.status === 'planned') {
    return (
      <div className="panel" style={{ minHeight: 220 }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
          Activity Feed
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 16 }}>No activity yet. This agent hasn’t been activated.</div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ minHeight: 220 }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
        Activity Feed
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {agent.recentActivity.map((entry, i) => {
          const style = typeStyles[entry.type];
          return (
            <div key={entry.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${style.color}`, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, marginTop: 2 }}>
                {style.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16 }}>{entry.description}</div>
                <div style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-muted)' }}>
                  <span>{timeAgo(entry.timestamp)}</span>
                  {entry.linkedAgent && (
                    <Link href={`/agent/${entry.linkedAgent}`} style={{ color: 'var(--accent-magenta)', textDecoration: 'none' }}>
                      {agents.find(a => a.id === entry.linkedAgent)?.name}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
