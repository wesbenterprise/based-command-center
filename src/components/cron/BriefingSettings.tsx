'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CronJob {
  id: string;
  name: string | null;
  cron: string | null;
  human: string | null;
  tz: string | null;
  message: string | null;
  enabled: boolean;
  next_run: string | null;
  last_run: string | null;
  channel: string | null;
  target: string | null;
  synced_at: string | null;
}

interface CronCommand {
  id: string;
  job_id: string;
  action: string;
  status: string;
  created_at: string;
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
] as const;

const emptyNewJob = { name: '', cron: '', tz: 'America/New_York' as string, message: '', model: 'sonnet' };

export default function BriefingSettings() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingCmds, setPendingCmds] = useState<Record<string, CronCommand>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newJob, setNewJob] = useState({ ...emptyNewJob });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const { data, error: err } = await supabase
        .from('cron_jobs')
        .select('*')
        .order('name');

      if (err) throw err;
      setJobs(data || []);
      setError(null);

      // Get the most recent sync time
      if (data && data.length > 0) {
        const latest = data.reduce((a, b) =>
          (a.synced_at || '') > (b.synced_at || '') ? a : b
        );
        setSynced(latest.synced_at);
      }

      // Check for any pending commands
      const { data: cmds } = await supabase
        .from('cron_commands')
        .select('*')
        .in('status', ['pending', 'running']);

      if (cmds) {
        const map: Record<string, CronCommand> = {};
        for (const c of cmds) map[c.job_id] = c;
        setPendingCmds(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cron jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Poll every 30s for fresh data
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpanded = (jobId: string) => {
    setExpanded(prev => ({ ...prev, [jobId]: !prev[jobId] }));
  };

  const sendCommand = async (jobId: string, action: string, payload: Record<string, any> = {}) => {
    try {
      const { error: err } = await supabase
        .from('cron_commands')
        .insert({ job_id: jobId, action, payload });

      if (err) throw err;

      // Optimistic: show as pending
      setPendingCmds(prev => ({
        ...prev,
        [jobId]: { id: 'temp', job_id: jobId, action, status: 'pending', created_at: new Date().toISOString() },
      }));

      // Refresh after a beat
      setTimeout(fetchJobs, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send command');
    }
  };

  const handleToggle = (job: CronJob) => {
    sendCommand(job.id, job.enabled ? 'disable' : 'enable');
  };

  const handleRun = (job: CronJob) => {
    sendCommand(job.id, 'run');
  };

  const handleDelete = (job: CronJob) => {
    if (confirmDelete === job.id) {
      sendCommand(job.id, 'delete');
      setConfirmDelete(null);
      // Optimistic remove from UI
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } else {
      setConfirmDelete(job.id);
      // Auto-clear confirmation after 3s
      setTimeout(() => setConfirmDelete(prev => prev === job.id ? null : prev), 3000);
    }
  };

  const handleAddJob = async () => {
    if (!newJob.name || !newJob.cron) {
      setError('Name and cron expression are required');
      return;
    }
    await sendCommand('new', 'add', {
      name: newJob.name,
      cron: newJob.cron,
      tz: newJob.tz,
      message: newJob.message,
      model: newJob.model,
    });
    setNewJob({ ...emptyNewJob });
    setShowAddForm(false);
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = d.getTime() - now.getTime();

      if (Math.abs(diff) < 60000) return 'just now';

      const absDiff = Math.abs(diff);
      const hours = Math.floor(absDiff / 3600000);
      const mins = Math.floor((absDiff % 3600000) / 60000);

      if (diff > 0) {
        if (hours > 24) return `in ${Math.floor(hours / 24)}d`;
        if (hours > 0) return `in ${hours}h ${mins}m`;
        return `in ${mins}m`;
      } else {
        if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
        if (hours > 0) return `${hours}h ago`;
        return `${mins}m ago`;
      }
    } catch {
      return iso;
    }
  };

  const syncAge = () => {
    if (!synced) return null;
    const diff = Date.now() - new Date(synced).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const sortedJobs = useMemo(() => {
    return [...jobs].sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id));
  }, [jobs]);

  if (loading) {
    return (
      <div className="panel" style={{ padding: 20 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading cron jobs...</div>
      </div>
    );
  }

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: 'var(--accent-magenta)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'var(--font-heading)' }}>
            All Jobs
          </h3>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--accent-green, #00ff88)',
            boxShadow: '0 0 6px var(--accent-green, #00ff88)',
          }} />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
            {jobs.length} JOBS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {synced && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
              SYNCED {syncAge()}
            </span>
          )}
          <button
            onClick={() => setShowAddForm(prev => !prev)}
            style={{
              border: '1px solid var(--accent-green, #00ff88)',
              background: 'rgba(0,255,136,0.1)',
              color: 'var(--accent-green, #00ff88)',
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '6px 12px',
              letterSpacing: '0.08em',
              cursor: 'pointer',
            }}
          >
            {showAddForm ? 'CANCEL' : '+ ADD JOB'}
          </button>
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
      </div>
      {error && (
        <div style={{ marginBottom: 12, color: 'var(--accent-amber)', fontSize: 14 }}>{error}</div>
      )}

      {showAddForm && (
        <div style={{ border: '1px solid var(--accent-green, #00ff88)', padding: 16, borderRadius: 4, background: 'rgba(0,255,136,0.05)', marginBottom: 16 }}>
          <h4 style={{ margin: '0 0 12px', fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--accent-green)', letterSpacing: '0.08em' }}>NEW CRON JOB</h4>
          <div style={{ display: 'grid', gap: 10 }}>
            <div>
              <label style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>NAME</label>
              <input
                value={newJob.name}
                onChange={e => setNewJob(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Weekly Report"
                style={{ marginTop: 4, width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: 14 }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>CRON EXPRESSION</label>
                <input
                  value={newJob.cron}
                  onChange={e => setNewJob(p => ({ ...p, cron: e.target.value }))}
                  placeholder="0 9 * * 1-5"
                  style={{ marginTop: 4, width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 10px', fontFamily: 'monospace', fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>TIMEZONE</label>
                <select
                  value={newJob.tz}
                  onChange={e => setNewJob(p => ({ ...p, tz: e.target.value }))}
                  style={{ marginTop: 4, width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 10px', fontSize: 14 }}
                >
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>MODEL</label>
                <select
                  value={newJob.model}
                  onChange={e => setNewJob(p => ({ ...p, model: e.target.value }))}
                  style={{ marginTop: 4, width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 10px', fontSize: 14 }}
                >
                  <option value="sonnet">Sonnet</option>
                  <option value="opus">Opus</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontFamily: 'var(--font-heading)', fontSize: 11, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>MESSAGE / PROMPT</label>
              <textarea
                value={newJob.message}
                onChange={e => setNewJob(p => ({ ...p, message: e.target.value }))}
                placeholder="What should the agent do when this job runs?"
                rows={3}
                style={{ marginTop: 4, width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 10px', fontFamily: 'var(--font-body)', fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleAddJob}
                style={{ border: '1px solid var(--accent-green)', background: 'rgba(0,255,136,0.15)', color: 'var(--accent-green)', fontFamily: 'var(--font-heading)', fontSize: 12, padding: '8px 20px', letterSpacing: '0.08em', cursor: 'pointer' }}
              >
                CREATE JOB
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedJobs.map(job => {
          const isExpanded = expanded[job.id];
          const statusColor = job.enabled ? 'var(--accent-green)' : 'var(--text-muted)';
          const pending = pendingCmds[job.id];
          return (
            <div key={job.id} style={{ border: '1px solid var(--border-subtle)', padding: 14, borderRadius: 4, background: 'rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16, marginBottom: 4 }}>{job.name || job.id}</div>
                  <div style={{ fontSize: 15, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{job.cron || '—'}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
                    Next: {formatTime(job.next_run)} · Last: {formatTime(job.last_run)}
                  </div>
                  {pending && (
                    <div style={{
                      fontSize: 12,
                      color: 'var(--accent-amber)',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.05em',
                      marginTop: 4,
                    }}>
                      ⏳ {pending.action.toUpperCase()} {pending.status === 'running' ? 'IN PROGRESS' : 'QUEUED'}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 12, letterSpacing: '0.08em', fontFamily: 'var(--font-heading)', color: statusColor }}>
                    {job.enabled ? 'ENABLED' : 'DISABLED'}
                  </span>
                  <button
                    onClick={() => handleToggle(job)}
                    disabled={!!pending}
                    style={{
                      width: 46,
                      height: 22,
                      borderRadius: 999,
                      border: '1px solid var(--border-subtle)',
                      background: job.enabled ? 'rgba(0,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      position: 'relative',
                      cursor: pending ? 'not-allowed' : 'pointer',
                      opacity: pending ? 0.5 : 1,
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
                    disabled={!!pending}
                    style={{ fontSize: 14, padding: '6px 12px', minHeight: 34, opacity: pending ? 0.5 : 1 }}
                  >
                    {pending?.action === 'run' ? 'QUEUED...' : 'RUN NOW'}
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
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
                    <button
                      onClick={() => handleDelete(job)}
                      disabled={!!pending}
                      style={{
                        border: '1px solid ' + (confirmDelete === job.id ? 'var(--accent-red, #ff4444)' : 'var(--border-subtle)'),
                        background: confirmDelete === job.id ? 'rgba(255,68,68,0.15)' : 'transparent',
                        color: confirmDelete === job.id ? 'var(--accent-red, #ff4444)' : 'var(--text-muted)',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 11,
                        padding: '4px 10px',
                        letterSpacing: '0.08em',
                        cursor: pending ? 'not-allowed' : 'pointer',
                        opacity: pending ? 0.5 : 1,
                      }}
                    >
                      {confirmDelete === job.id ? 'CONFIRM?' : 'DELETE'}
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                      CRON EXPRESSION
                    </label>
                    <div style={{
                      marginTop: 6,
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-primary)',
                      padding: '8px 10px',
                      fontFamily: 'monospace',
                      fontSize: 15,
                    }}>
                      {job.cron || '—'}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                      TIMEZONE
                    </label>
                    <div style={{
                      marginTop: 6,
                      color: 'var(--text-secondary)',
                      fontSize: 15,
                    }}>
                      {job.tz || 'America/New_York'}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                      MESSAGE / PROMPT
                    </label>
                    <div style={{
                      marginTop: 6,
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                      padding: '8px 10px',
                      fontSize: 13,
                      lineHeight: 1.5,
                      maxHeight: 200,
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}>
                      {job.message || '—'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                        TARGET
                      </div>
                      <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 15 }}>{job.target || '—'}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--accent-magenta)', letterSpacing: '0.08em' }}>
                        DELIVERY
                      </div>
                      <div style={{ marginTop: 6, color: 'var(--text-secondary)', fontSize: 15 }}>{job.channel || '—'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!sortedJobs.length && (
          <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>No cron jobs found. Waiting for sync...</div>
        )}
      </div>
    </div>
  );
}
