import { NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

export async function GET() {
  try {
    const agentsDir = join(homedir(), '.openclaw', 'agents');
    const agents = await readdir(agentsDir).catch(() => []);
    const now = Date.now();
    const results: any[] = [];

    for (const agentId of agents) {
      const sessionFile = join(agentsDir, agentId, 'sessions', 'sessions.json');
      try {
        const raw = await readFile(sessionFile, 'utf8');
        const data = JSON.parse(raw);
        
        let latestMs = 0;
        let sessionCount = 0;
        let latestModel = '';
        let latestChannel = '';
        
        for (const [key, session] of Object.entries(data)) {
          if (typeof session !== 'object' || !session) continue;
          const s = session as any;
          sessionCount++;
          const ts = s.updatedAt || s.createdAt || 0;
          if (ts > latestMs) {
            latestMs = ts;
            latestModel = s.model || '';
            latestChannel = s.lastChannel || s.channel || '';
          }
        }

        const agoMin = latestMs > 0 ? Math.floor((now - latestMs) / 60000) : -1;
        const agoSec = latestMs > 0 ? Math.floor((now - latestMs) / 1000) : -1;
        const status = agoSec >= 0 && agoSec < 20 ? 'live' 
          : agoMin < 60 ? 'recent' 
          : agoMin < 1440 ? 'idle' 
          : 'dormant';

        results.push({
          agentId,
          status,
          sessionCount,
          lastActiveMs: latestMs,
          lastActiveMinAgo: agoMin,
          model: latestModel,
          channel: latestChannel,
        });
      } catch {
        // No session store for this agent
        results.push({
          agentId,
          status: 'dormant',
          sessionCount: 0,
          lastActiveMs: 0,
          lastActiveMinAgo: -1,
          model: '',
          channel: '',
        });
      }
    }

    // Map gateway agent IDs to Command Center IDs
    const idMap: Record<string, string> = { main: 'ace' };
    for (const r of results) {
      r.agentId = idMap[r.agentId] || r.agentId;
    }

    // Filter out non-agent directories
    const validAgents = new Set(['ace', 'astra', 'dezayas', 'rybo', 'charles', 'romero', 'cid', 'julius', 'anderson', 'pressy', 'oracle', 'doc', 'claude', 'scout']);
    const filtered = results.filter(r => validAgents.has(r.agentId));

    // Sort: live first, then recent, then idle, then dormant
    const order = { live: 0, recent: 1, idle: 2, dormant: 3 };
    filtered.sort((a, b) => (order[a.status as keyof typeof order] ?? 9) - (order[b.status as keyof typeof order] ?? 9));

    return NextResponse.json(filtered);
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to read sessions', detail: e.message }, { status: 500 });
  }
}
