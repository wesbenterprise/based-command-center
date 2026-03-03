'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSmartPoll } from '@/hooks/useSmartPoll';
import { timeAgo } from '@/lib/format';

interface ActivityItem {
  id: string;
  agent_id: string;
  agent_name: string;
  activity_type: string;
  description: string;
  linked_agent_id?: string | null;
  metadata?: Record<string, unknown>;
  created_at: string;
}

const typeIcons: Record<string, string> = {
  task_completed: '✅',
  task_started: '🚀',
  dispatch_sent: '📤',
  dispatch_received: '📥',
  flag: '🚩',
  error: '❌',
  message: '💬',
  deploy: '🚢',
  decision: '⚖️',
  review: '🔍',
};

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    const params = new URLSearchParams();
    params.set('limit', '50');
    if (selectedType) params.set('type', selectedType);
    if (selectedAgent) params.set('agent', selectedAgent);

    const res = await fetch(`/api/activity-feed?${params.toString()}`);
    const json = await res.json();
    if (json?.data) setActivities(json.data as ActivityItem[]);
    setLoading(false);
  }, [selectedType, selectedAgent]);

  const { refetch } = useSmartPoll(fetchFeed, { intervalMs: 30000, enabled: true, immediate: false });

  useEffect(() => { refetch(); }, [selectedType, selectedAgent, refetch]);

  const typeOptions = useMemo(() => {
    const types = new Set(activities.map(a => a.activity_type));
    return Array.from(types).sort();
  }, [activities]);

  const agentOptions = useMemo(() => {
    const agents = new Map<string, string>();
    activities.forEach(a => { if (a.agent_id && a.agent_name) agents.set(a.agent_id, a.agent_name); });
    return Array.from(agents.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [activities]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Recent Activity
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            style={{
              background: 'rgba(10,12,18,0.8)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 10px',
              borderRadius: 6,
              fontFamily: 'var(--font-body)'
            }}
          >
            <option value="">All Types</option>
            {typeOptions.map(t => (
              <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <select
            value={selectedAgent}
            onChange={e => setSelectedAgent(e.target.value)}
            style={{
              background: 'rgba(10,12,18,0.8)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 10px',
              borderRadius: 6,
              fontFamily: 'var(--font-body)'
            }}
          >
            <option value="">All Agents</option>
            {agentOptions.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading activity…</div>
      ) : activities.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No activity yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activities.map(activity => (
            <div key={activity.id} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 16 }}>
              <span style={{ color: 'var(--text-muted)', minWidth: 70 }}>{timeAgo(activity.created_at)}</span>
              <span style={{ minWidth: 28 }}>{typeIcons[activity.activity_type] || '•'}</span>
              <Link href={`/agent/${activity.agent_id}`} style={{ color: 'var(--accent-cyan)', minWidth: 90, textDecoration: 'none' }}>
                {activity.agent_name}
              </Link>
              <span>{activity.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
