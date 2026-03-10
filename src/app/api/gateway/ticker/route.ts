import { NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

const AGENT_META: Record<string, { emoji: string; name: string }> = {
  main: { emoji: '♠️', name: 'Ace' },
  ace: { emoji: '♠️', name: 'Ace' },
  astra: { emoji: '⚡', name: 'Astra' },
  dezayas: { emoji: '🔧', name: 'Dezayas' },
  rybo: { emoji: '🎭', name: 'Rybo' },
  charles: { emoji: '📚', name: 'Charles' },
  romero: { emoji: '🎨', name: 'Romero' },
  cid: { emoji: '🎮', name: 'Cid' },
  julius: { emoji: '🌉', name: 'Julius' },
  anderson: { emoji: '📊', name: 'Anderson' },
  pressy: { emoji: '📰', name: 'Pressy' },
  scout: { emoji: '🔭', name: 'Scout' },
};

interface TickerEvent {
  id: string;
  agentEmoji: string;
  agentName: string;
  text: string;
  ts: string;
}

export async function GET() {
  try {
    const agentsDir = join(homedir(), '.openclaw', 'agents');
    const agentDirs = await readdir(agentsDir).catch(() => []);
    const events: TickerEvent[] = [];

    for (const agentId of agentDirs) {
      const meta = AGENT_META[agentId] || { emoji: '🤖', name: agentId };
      const sessionsFile = join(agentsDir, agentId, 'sessions', 'sessions.json');

      try {
        const raw = await readFile(sessionsFile, 'utf8');
        const data = JSON.parse(raw);

        for (const [key, session] of Object.entries(data)) {
          if (typeof session !== 'object' || !session) continue;
          const s = session as any;
          const ts = s.updatedAt || s.createdAt;
          if (!ts) continue;

          // Only show sessions active in the last 7 days
          const ageMs = Date.now() - ts;
          if (ageMs > 7 * 24 * 60 * 60 * 1000) continue;

          const channel = s.channel || 'unknown';
          const model = s.model || '';
          const kind = s.kind || 'main';

          // Build a human-readable event description
          let text = '';
          if (kind === 'main') {
            text = `Active session on ${channel}`;
            if (model) text += ` (${model.split('/').pop()})`;
          } else if (kind === 'subagent') {
            text = `Sub-agent task completed`;
          } else {
            text = `Session: ${kind}`;
          }

          events.push({
            id: `${agentId}-${key}-${ts}`,
            agentEmoji: meta.emoji,
            agentName: meta.name,
            text,
            ts: new Date(ts).toISOString(),
          });
        }
      } catch {
        // skip agents without session files
      }
    }

    // Also check daily memory files for recent operational events
    const workspaceDir = join(homedir(), '.openclaw', 'workspace-ace', 'memory');
    const today = new Date().toISOString().split('T')[0];
    const memFile = join(workspaceDir, `${today}.md`);
    try {
      const memRaw = await readFile(memFile, 'utf8');
      // Extract first few section headers as events
      const headers = memRaw.match(/^##+ .+$/gm)?.slice(0, 5) || [];
      headers.forEach((h, i) => {
        events.push({
          id: `mem-${today}-${i}`,
          agentEmoji: '♠️',
          agentName: 'Ace',
          text: h.replace(/^#+\s*/, ''),
          ts: new Date().toISOString(),
        });
      });
    } catch {
      // no daily memory yet
    }

    // Sort by most recent first, limit to 15
    events.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    return NextResponse.json({ events: events.slice(0, 15) });
  } catch (err) {
    return NextResponse.json({ events: [], error: String(err) });
  }
}
