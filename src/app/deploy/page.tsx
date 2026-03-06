'use client';

import { useState, useEffect } from 'react';

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
    <div className="flex items-center gap-3">
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        GitHub ↗
      </a>
      {repo.homepage && (
        <a
          href={repo.homepage}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Live Site ↗
        </a>
      )}
    </div>
  );
}

export default function DeployPage() {
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
    } catch (e: any) {
      setError(e.message);
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
        setResults((prev) => ({ ...prev, [key]: { success: false, message: data.error } }));
      } else {
        setResults((prev) => ({ ...prev, [key]: { success: true, message: data.message } }));
        // Refresh after push
        setTimeout(fetchRepos, 2000);
      }
    } catch (e: any) {
      setResults((prev) => ({ ...prev, [key]: { success: false, message: e.message } }));
    } finally {
      setPushing(null);
    }
  };

  // Repos with branches that have conflicts (ahead AND behind)
  const reposWithConflicts = repos
    .map((r) => ({
      ...r,
      conflict_branches: r.unmerged_branches.filter((b) => b.behind > 0),
    }))
    .filter((r) => r.conflict_branches.length > 0);

  // Repos with clean merge candidates only (ahead, not behind)
  const reposReadyToPush = repos
    .map((r) => ({
      ...r,
      clean_branches: r.unmerged_branches.filter((b) => b.behind === 0),
    }))
    .filter((r) => r.clean_branches.length > 0);

  const reposEmpty = repos.filter((r) => r.unmerged_branches.length === 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Push to Live</h1>
            <p className="text-zinc-500 text-sm mt-1">
              Merge branches to main → Vercel auto-deploys
            </p>
          </div>
          <button
            onClick={fetchRepos}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Scanning...' : '↻ Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Merge Conflicts — needs review */}
        {reposWithConflicts.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs tracking-[0.2em] uppercase text-red-400 mb-4">
              ⚠ Merge Conflicts ({reposWithConflicts.length})
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              These branches are behind main — merging may fail or overwrite changes.
            </p>
            <div className="space-y-3">
              {reposWithConflicts.map((repo) => (
                <div
                  key={repo.name}
                  className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-red-500/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{repo.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-red-400/70">
                            {repo.conflict_branches.length} branch{repo.conflict_branches.length !== 1 ? 'es' : ''} with conflicts
                          </p>
                          <RepoLinks repo={repo} />
                        </div>
                      </div>
                      <span className="text-xs text-zinc-600">
                        pushed {new Date(repo.pushed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-red-500/10">
                    {repo.conflict_branches.map((branch) => {
                      const key = `${repo.name}/${branch.name}`;
                      const result = results[key];
                      const isPushing = pushing === key;

                      return (
                        <div key={branch.name} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <code className="text-sm text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                              {branch.name}
                            </code>
                            <span className="text-xs text-zinc-500">
                              {branch.ahead} ahead, {branch.behind} behind {repo.default_branch}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {result && (
                              <span className={`text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                {result.success ? '✓ ' : '✕ '}{result.message}
                              </span>
                            )}
                            <button
                              onClick={() => pushToLive(repo.name, branch.name)}
                              disabled={isPushing || result?.success}
                              className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${result?.success
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
                                  : isPushing
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    : 'bg-red-500/80 text-white hover:bg-red-500'
                                }
                                disabled:opacity-60
                              `}
                            >
                              {result?.success ? 'Merged ✓' : isPushing ? 'Merging...' : 'Force Merge'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Ready to Push — clean merges */}
        {reposReadyToPush.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs tracking-[0.2em] uppercase text-amber-400 mb-4">
              Ready to Push ({reposReadyToPush.length})
            </h2>
            <div className="space-y-3">
              {reposReadyToPush.map((repo) => (
                <div
                  key={repo.name}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
                >
                  <div className="px-5 py-4 border-b border-zinc-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{repo.name}</h3>
                        <div className="flex items-center gap-3 mt-0.5">
                          <p className="text-xs text-zinc-500">
                            {repo.clean_branches.length} branch{repo.clean_branches.length !== 1 ? 'es' : ''} ready
                          </p>
                          <RepoLinks repo={repo} />
                        </div>
                      </div>
                      <span className="text-xs text-zinc-600">
                        pushed {new Date(repo.pushed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-zinc-800/30">
                    {repo.clean_branches.map((branch) => {
                      const key = `${repo.name}/${branch.name}`;
                      const result = results[key];
                      const isPushing = pushing === key;

                      return (
                        <div key={branch.name} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <code className="text-sm text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                              {branch.name}
                            </code>
                            <span className="text-xs text-zinc-500">
                              {branch.ahead} commit{branch.ahead !== 1 ? 's' : ''} ahead
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {result && (
                              <span className={`text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                                {result.success ? '✓ ' : '✕ '}{result.message}
                              </span>
                            )}
                            <button
                              onClick={() => pushToLive(repo.name, branch.name)}
                              disabled={isPushing || result?.success}
                              className={`
                                px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${result?.success
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-default'
                                  : isPushing
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-amber-500 text-black hover:bg-amber-400'
                                }
                                disabled:opacity-60
                              `}
                            >
                              {result?.success ? 'Live ✓' : isPushing ? 'Merging...' : 'Push to Live'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All clean productions */}
        {reposEmpty.length > 0 && (
          <section>
            <h2 className="text-xs tracking-[0.2em] uppercase text-zinc-600 mb-4">
              All Productions — Up to Date ({reposEmpty.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {reposEmpty.map((repo) => (
                <div
                  key={repo.name}
                  className="px-4 py-3 rounded-lg border border-zinc-800/30 bg-zinc-900/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-zinc-400">{repo.name}</span>
                    <RepoLinks repo={repo} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">
                      {new Date(repo.pushed_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-green-500/50">✓ clean</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Loading state */}
        {loading && repos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm animate-pulse">Scanning repositories...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && repos.length === 0 && !error && (
          <div className="text-center py-20">
            <p className="text-zinc-500 text-sm">All repos are up to date.</p>
          </div>
        )}
      </div>
    </div>
  );
}
