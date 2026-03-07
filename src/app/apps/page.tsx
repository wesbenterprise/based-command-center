'use client';

import { useState, useEffect } from 'react';
import { categories } from '@/apps.config';

// ─── Deploy types & logic (merged from /deploy) ────────────
interface Branch {
  name: string;
  ahead: number;
  behind: number;
}

interface Repo {
  name: string;
  full_name: string;
  default_branch: string;
  pushed_at: string;
  html_url: string;
  homepage: string | null;
  unmerged_branches: Branch[];
}

function RepoLinks({ repo }: { repo: Repo }) {
  return (
    <span style={{ display: 'inline-flex', gap: 10 }}>
      <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
        style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-cyan)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
      >GitHub ↗</a>
      {repo.homepage && (
        <a href={repo.homepage} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-cyan)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >Live ↗</a>
      )}
    </span>
  );
}

function DeploySection() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [pushing, setPushing] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/deploy/repos');
      if (!res.ok) throw new Error('Failed to fetch repos');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRepos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRepos(); }, []);

  const pushToLive = async (repo: string, branch: string) => {
    const key = `${repo}/${branch}`;
    setPushing(key);
    try {
      const res = await fetch('/api/deploy/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, branch }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResults(prev => ({ ...prev, [key]: { success: false, message: data.error } }));
      } else {
        setResults(prev => ({ ...prev, [key]: { success: true, message: data.message } }));
        setTimeout(fetchRepos, 2000);
      }
    } catch (e: unknown) {
      setResults(prev => ({ ...prev, [key]: { success: false, message: e instanceof Error ? e.message : 'Unknown error' } }));
    } finally {
      setPushing(null);
    }
  };

  const reposWithConflicts = repos
    .map(r => ({ ...r, conflict_branches: r.unmerged_branches.filter(b => b.behind > 0) }))
    .filter(r => r.conflict_branches.length > 0);

  const reposReadyToPush = repos
    .map(r => ({ ...r, clean_branches: r.unmerged_branches.filter(b => b.behind === 0) }))
    .filter(r => r.clean_branches.length > 0);

  const reposEmpty = repos.filter(r => r.unmerged_branches.length === 0);

  if (loading && repos.length === 0) {
    return <div style={{ color: 'var(--text-muted)', fontSize: 15, padding: 20, textAlign: 'center' }}>Scanning repositories...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, color: 'var(--accent-amber)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Deploy / Push to Live
        </h3>
        <button
          onClick={fetchRepos}
          disabled={loading}
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'transparent',
            color: 'var(--accent-cyan)',
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            padding: '6px 12px',
            letterSpacing: '0.08em',
            cursor: 'pointer',
            opacity: loading ? 0.4 : 1,
          }}
        >
          {loading ? 'Scanning...' : '↻ Refresh'}
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: 'var(--accent-red)', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Merge Conflicts */}
      {reposWithConflicts.map(repo => (
        <div key={repo.name} className="panel" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{repo.name}</span>
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--accent-red)' }}>⚠ {repo.conflict_branches.length} conflict{repo.conflict_branches.length !== 1 ? 's' : ''}</span>
              <div style={{ marginTop: 4 }}><RepoLinks repo={repo} /></div>
            </div>
          </div>
          {repo.conflict_branches.map(branch => {
            const key = `${repo.name}/${branch.name}`;
            const result = results[key];
            const isPushing = pushing === key;
            return (
              <div key={branch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ fontSize: 14, color: 'var(--accent-red)', background: 'rgba(239,68,68,0.1)', padding: '2px 8px' }}>{branch.name}</code>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{branch.ahead} ahead, {branch.behind} behind</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {result && <span style={{ fontSize: 13, color: result.success ? 'var(--accent-green)' : 'var(--accent-red)' }}>{result.success ? '✓ ' : '✕ '}{result.message}</span>}
                  <button
                    onClick={() => pushToLive(repo.name, branch.name)}
                    disabled={isPushing || result?.success}
                    style={{
                      border: '1px solid var(--accent-red)',
                      background: isPushing ? 'transparent' : result?.success ? 'rgba(0,255,0,0.1)' : 'rgba(239,68,68,0.2)',
                      color: result?.success ? 'var(--accent-green)' : 'var(--accent-red)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12,
                      padding: '6px 14px',
                      cursor: isPushing || result?.success ? 'default' : 'pointer',
                      opacity: isPushing ? 0.6 : 1,
                    }}
                  >
                    {result?.success ? 'Merged ✓' : isPushing ? 'Merging...' : 'Force Merge'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Ready to Push */}
      {reposReadyToPush.map(repo => (
        <div key={repo.name} className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{repo.name}</span>
              <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--accent-amber)' }}>{repo.clean_branches.length} ready</span>
              <div style={{ marginTop: 4 }}><RepoLinks repo={repo} /></div>
            </div>
          </div>
          {repo.clean_branches.map(branch => {
            const key = `${repo.name}/${branch.name}`;
            const result = results[key];
            const isPushing = pushing === key;
            return (
              <div key={branch.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{ fontSize: 14, color: 'var(--accent-cyan)', background: 'rgba(0,255,255,0.08)', padding: '2px 8px' }}>{branch.name}</code>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{branch.ahead} commit{branch.ahead !== 1 ? 's' : ''} ahead</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {result && <span style={{ fontSize: 13, color: result.success ? 'var(--accent-green)' : 'var(--accent-red)' }}>{result.success ? '✓ ' : '✕ '}{result.message}</span>}
                  <button
                    onClick={() => pushToLive(repo.name, branch.name)}
                    disabled={isPushing || result?.success}
                    style={{
                      border: '1px solid var(--accent-amber)',
                      background: result?.success ? 'rgba(0,255,0,0.1)' : 'rgba(234,179,8,0.15)',
                      color: result?.success ? 'var(--accent-green)' : 'var(--accent-amber)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12,
                      padding: '6px 14px',
                      cursor: isPushing || result?.success ? 'default' : 'pointer',
                      opacity: isPushing ? 0.6 : 1,
                    }}
                  >
                    {result?.success ? 'Live ✓' : isPushing ? 'Merging...' : 'Push to Live'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* All Clean */}
      {reposEmpty.length > 0 && (
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Up to Date ({reposEmpty.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
            {reposEmpty.map(repo => (
              <div key={repo.name} style={{ padding: '10px 14px', border: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{repo.name}</span>
                  <RepoLinks repo={repo} />
                </div>
                <span style={{ fontSize: 12, color: 'rgba(0,255,0,0.5)' }}>✓ clean</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && repos.length === 0 && !error && (
        <div style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: 20 }}>All repos are up to date.</div>
      )}
    </div>
  );
}

// ─── Apps Page ──────────────────────────────────────────────
export default function AppsPage() {
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* App Directory */}
        {categories.map(cat => (
          <div key={cat.name}>
            <h3 style={{ fontSize: 16, color: 'var(--accent-magenta)', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {cat.emoji} {cat.name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {cat.apps.map(app => (
                <a key={app.name} href={app.url || '#'} target="_blank" rel="noopener" className="panel" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>{app.icon} {app.name}</span>
                    <span style={{
                      fontSize: 14, fontFamily: 'var(--font-heading)', letterSpacing: '0.04em', padding: '4px 10px',
                      border: `1px solid ${app.status === 'ONLINE' ? 'var(--accent-green)' : app.status === 'IN PROGRESS' ? 'var(--accent-amber)' : 'var(--text-muted)'}`,
                      color: app.status === 'ONLINE' ? 'var(--accent-green)' : app.status === 'IN PROGRESS' ? 'var(--accent-amber)' : 'var(--text-muted)',
                    }}>
                      {app.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{app.description}</div>
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,0,255,0.15)', margin: '8px 0' }} />

        {/* Deploy Section */}
        <DeploySection />
      </div>
    </main>
  );
}
