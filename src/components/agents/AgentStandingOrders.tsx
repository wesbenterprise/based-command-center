import { Task } from "../../data/tasks";

export default function AgentStandingOrders({ tasks }: { tasks: Task[] }) {
  return (
    <div className="panel">
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12 }}>
        Standing Orders
      </div>
      {tasks.length === 0 ? (
        <div style={{ color: 'var(--text-muted)' }}>No standing orders assigned.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
          {tasks.map(t => (
            <div key={t.id} style={{ border: '1px solid var(--border-subtle)', padding: 12, clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{t.name}</div>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: t.health === 'green' ? 'var(--accent-green)' : t.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-red)',
                  boxShadow: `0 0 6px ${t.health === 'green' ? 'var(--accent-green)' : t.health === 'amber' ? 'var(--accent-amber)' : 'var(--accent-red)'}`
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 15, color: 'var(--accent-cyan)' }}>{t.project}</span>
                <span style={{
                  fontSize: 12, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase',
                  border: '1px solid var(--border-subtle)', padding: '2px 6px', color: 'var(--text-muted)'
                }}>
                  {t.frequency}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>Last: {t.lastRun}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
