'use client';

import { useEffect, useMemo, useState } from 'react';

interface CronJob {
  id: string;
  name?: string;
  cron?: string;
  schedule?: string;
  human?: string;
  tz?: string;
  timezone?: string;
  message?: string;
  enabled?: boolean;
  nextRun?: string;
  next_run?: string;
  lastRun?: string;
  last_run?: string;
  delivery?: { channel?: string; target?: string };
  channel?: string;
  target?: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
] as const;

export default function BriefingSettings() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, Partial<CronJob>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/cron');
      const data = await res.json();
      if (res.ok) {
        setJobs(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError(data?.error || 'Failed to load cron jobs');
      }
    } catch {
      setError('Failed to load cron jobs');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleExpanded = (jobId: string) => {
    setExpanded(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const updateDraft = (jobId: string, patch: Partial<CronJob>) => {
    setDrafts(prev => ({ ...prev, [jobId]: { ...prev[jobId], ...patch } }));
  };

  const scheduleLabel = (job: CronJob) => job.human || job.schedule || job.cron || '—';
  const nextRunLabel = (job: CronJob) => job.nextRun || job.next_run || '—';
  const lastRunLabel = (job: CronJob) => job.lastRun || job.last_run || '—';
  const tzLabel = (job: CronJob) => job.tz || job.timezone || 'America/New_York';
  const messageLabel = (job: CronJob) => job.message || '';
  const cronLabel = (job: CronJob) => job.cron || '';
  const delivery = (job: CronJob) => {
    const channel = job.delivery?.channel || job.channel || '—';
    const target = job.delivery?.target || job.target || '—';
    return { channel, target };
  };

  const submitPatch = async (job: CronJob, patch: Record<string, any>) => {
    setSaving(prev => ({ ...prev, [job.id]: true }));
    try {
      const res = await fetch('/api/cron', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, patch }),
      });
      const data = await res.json();
      if (res.ok) {
        setJobs(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError(data?.error || 'Failed to update cron job');
      }
    } catch {
      setError('Failed to update cron job');
    } finally {
      setSaving(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const handleSave = async (job: CronJob) => {
    const draft = drafts[job.id] || {};
    const cron = draft.cron ?? cronLabel(job);
    const tz = draft.tz ?? tzLabel(job);
    const message = draft.message ?? messageLabel(job);

    const patch: Record<string, any> = {};
    if (cron !== cronLabel(job)) patch.cron = cron;
    if (tz !== tzLabel(job)) patch.tz = tz;
    if (message !== messageLabel(job)) patch.message = message;

    if (!Object.keys(patch).length) return;
    await submitPatch(job, patch);
  };

  const handleToggle = async (job: CronJob) => {
    await submitPatch(job, { enabled: !job.enabled });
  };

  const handleRun = async (job: CronJob) => {
    setRunning(prev => ({ ...prev, [job.id]: true }));
    try {
      const res = await fetch('/api/cron/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to run cron job');
      } else {
        setError(null);
        fetchJobs();
      }
    } catch {
      setError('Failed to run cron job');
    } finally {
      setRunning(prev => ({ ...prev, [job.id]: false }));
    }
  };

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
  }, [jobs]);

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: 'var(--accent-magenta)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
          All Jobs
        </h3>
        <button
          onClick={fetchJobs}
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            padding: '6px 12px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          Refresh
        </button>
      </div>
      {error && (
        <div style={{ marginBottom: 12, color: 'var(--accent-amber)', fontSize: 14 }}>{error}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedJobs.map(job => {
          const isExpanded = expanded[job.id];
          const statusColor = job.enabled ? 'var(--accent-green)' : 'var(--text-muted)';
          const { channel, target } = delivery(job);
          return (
            <div key={job.id} style={{ border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 4, background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, marginBottom: 4 }}>{job.name || job.id}</div>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{scheduleLabel(job)}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                    Next: {nextRunLabel(job)} · Last: {lastRunLabel(job)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 12, letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', color: statusColor }}>
                    {job.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <button
                    onClick={() => handleToggle(job)}
                    style={{
                      width: 46,
                      height: 22,
                      borderRadius: 999,
                      border: '1px solid var(--border-subtle)',
                      background: job.enabled ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      position: 'relative',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: job.enabled ? 24 : 2,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        background: job.enabled ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        transition: 'left 0.2s ease',
                        boxShadow: job.enabled ? '0 0 8px var(--accent-cyan)' : 'none',
                      }}
                    />
                  </button>
                  <button
                    className="run-btn"
                    onClick={() => handleRun(job)}
                    disabled={running[job.id]}
                    style={{ fontSize: 14, padding: '6px 12px', minHeight: 34 }}
                  >
                    {running[job.id] ? 'RUNNING...' : 'RUN NOW'}
                  </button>
                  <button
                    onClick={() => toggleExpanded(job.id)}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      background: 'transparent',
                      color: 'var(--accent-cyan)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 11,
                      padding: '4px 10px',
                      letterSpacing: '0.08em',
                      cursor: 'pointer',
                    }}
                  >
                    {isExpanded ? 'HIDE' : 'DETAILS'}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                      CRON EXPRESSION
                    </label>
                    <input
                      value={String(drafts[job.id]?.cron ?? cronLabel(job))}
                      onChange={(e) => updateDraft(job.id, { cron: e.target.value })}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 16,
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                      TIMEZONE
                    </label>
                    <select
                      value={String(drafts[job.id]?.tz ?? tzLabel(job))}
                      onChange={(e) => updateDraft(job.id, { tz: e.target.value })}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 16,
                      }}
                    >
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                      MESSAGE / PROMPT
                    </label>
                    <textarea
                      value={String(drafts[job.id]?.message ?? messageLabel(job))}
                      onChange={(e) => updateDraft(job.id, { message: e.target.value })}
                      rows={4}
                      style={{
                        marginTop: 6,
                        width: '100%',
                        background: 'rgba(0,0,0,0.35)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                        padding: '8px 10px',
                        fontFamily: 'var(--font-body)',
                        fontSize: 16,
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                        DELIVERY CHANNEL
                      </div>
                      <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 15 }}>{channel}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                        DELIVERY TARGET
                      </div>
                      <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 15 }}>{target}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleSave(job)}
                      disabled={saving[job.id]}
                      style={{
                        border: '1px solid var(--accent-cyan)',
                        background: 'rgba(0,255,255,0.1)',
                        color: 'var(--accent-cyan)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 12,
                        padding: '8px 18px',
                        letterSpacing: '0.08em',
                        cursor: 'pointer',
                      }}
                    >
                      {saving[job.id] ? 'SAVING...' : 'SAVE'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!sortedJobs.length && (
          <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No cron jobs found.</div>
        )}
      </div>
    </div>
  );
}
