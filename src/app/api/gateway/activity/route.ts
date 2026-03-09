import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// Returns per-agent activity: hourly message counts for last 24h
export async function GET() {
  try {
    const agentsDir = join(homedir(), '.openclaw', 'agents');
    const agentDirs = await readdir(agentsDir).catch(() => []);
    const now = Date.now();
    const hours24 = 24 * 60 * 60 * 1000;
    const idMap: Record<string, string> = { main: 'ace' };
    const validAgents = new Set(['ace', 'astra', 'dezayas', 'rybo', 'charles', 'romero', 'cid', 'julius', 'anderson', 'pressy', 'claude', 'scout']);

    const results: Record<string, number[]> = {};

    for (const agentId of agentDirs) {
      const mappedId = idMap[agentId] || agentId;
      if (!validAgents.has(mappedId)) continue;

      // Initialize 24 hourly buckets (index 0 = 24h ago, index 23 = current hour)
      const buckets = new Array(24).fill(0);

      const sessionsFile = join(agentsDir, agentId, 'sessions', 'sessions.json');
      try {
        const raw = await readFile(sessionsFile, 'utf8');
        const data = JSON.parse(raw);

        for (const [key, session] of Object.entries(data)) {
          if (typeof session !== 'object' || !session) continue;
          const s = session as any;
          
          // Check if session was active in last 24h
          const updatedAt = s.updatedAt || 0;
          if (updatedAt > now - hours24) {
            const hoursAgo = Math.floor((now - updatedAt) / (60 * 60 * 1000));
            const bucket = Math.max(0, Math.min(23, 23 - hoursAgo));
            // Weight by token count as a proxy for activity volume
            const tokens = (s.inputTokens || 0) + (s.outputTokens || 0);
            buckets[bucket] += tokens > 0 ? Math.ceil(tokens / 1000) : 1;
          }

          // Also check session JSONL files for message timestamps
          if (s.sessionFile) {
            try {
              const fstat = await stat(s.sessionFile);
              const modTime = fstat.mtimeMs;
              if (modTime > now - hours24) {
                const hoursAgo = Math.floor((now - modTime) / (60 * 60 * 1000));
                const bucket = Math.max(0, Math.min(23, 23 - hoursAgo));
                buckets[bucket] += 1;
              }
            } catch {}
          }
        }
      } catch {}

      results[mappedId] = buckets;
    }

    return NextResponse.json(results);
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to read activity', detail: e.message }, { status: 500 });
  }
}
