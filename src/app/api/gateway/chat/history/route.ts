import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';

// Map command center agent IDs to gateway agent IDs
const agentIdMap: Record<string, string> = { ace: 'main' };
const reverseMap: Record<string, string> = { main: 'ace' };

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get('agent') || 'ace';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
  const gatewayAgent = agentIdMap[agentId] || agentId;

  try {
    // Read sessions.json to find the main session for this agent
    const sessionsPath = join(homedir(), '.openclaw', 'agents', gatewayAgent, 'sessions', 'sessions.json');
    const sessionsRaw = await readFile(sessionsPath, 'utf8');
    const sessions = JSON.parse(sessionsRaw);

    // Find the main direct session
    const mainKey = `agent:${gatewayAgent}:main`;
    const mainSession = sessions[mainKey];
    if (!mainSession?.sessionId) {
      return NextResponse.json({ messages: [], sessionKey: mainKey });
    }

    // Read the JSONL transcript
    const jsonlPath = join(homedir(), '.openclaw', 'agents', gatewayAgent, 'sessions', `${mainSession.sessionId}.jsonl`);
    const raw = await readFile(jsonlPath, 'utf8');
    const lines = raw.trim().split('\n').filter(Boolean);

    // Parse and filter to user/assistant text messages only
    const messages: any[] = [];
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type !== 'message') continue;
        const msg = entry.message;
        if (!msg) continue;

        if (msg.role === 'user') {
          // Extract text content, skip system/tool messages
          const text = typeof msg.content === 'string' ? msg.content
            : Array.isArray(msg.content) 
              ? msg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n')
              : null;
          if (!text || text.includes('[Internal task completion event]') || text.includes('openclaw.inbound_meta')) continue;
          // Skip heartbeat prompts, system events, inter-session messages
          if (text.includes('Read HEARTBEAT.md') || text.includes('Pre-compaction memory flush')) continue;
          if (text.startsWith('System:') || text.startsWith('[Inter-session message]')) continue;
          if (text.includes('openclaw-tui (gateway-client)') && !text.includes('EDT]')) continue;
          // Strip metadata envelopes
          let cleaned = text
            .replace(/^Conversation info \(untrusted.*?\n```json\n[\s\S]*?```\n\nSender \(untrusted.*?\n```json\n[\s\S]*?```\n\n/m, '')
            .replace(/^Sender \(untrusted.*?\n```json\n[\s\S]*?```\n\n/m, '')
            .replace(/^\[Mon .*? EDT\]\s*/m, '')
            .trim();
          if (!cleaned) continue;
          messages.push({
            id: entry.id,
            role: 'user',
            content: cleaned,
            timestamp: entry.timestamp,
          });
        } else if (msg.role === 'assistant') {
          // Extract text content only (skip tool calls)
          const textParts = Array.isArray(msg.content) 
            ? msg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text)
            : typeof msg.content === 'string' ? [msg.content] : [];
          const text = textParts.join('\n').trim();
          if (!text || text === 'NO_REPLY' || text === 'HEARTBEAT_OK') continue;
          messages.push({
            id: entry.id,
            role: 'assistant',
            content: text,
            timestamp: entry.timestamp,
            agentId,
          });
        }
      } catch { /* skip malformed lines */ }
    }

    // Return last N messages
    const recent = messages.slice(-limit);
    return NextResponse.json({ 
      messages: recent, 
      sessionKey: mainKey,
      sessionId: mainSession.sessionId,
      total: messages.length,
    });
  } catch (e: any) {
    return NextResponse.json({ messages: [], error: e.message }, { status: 500 });
  }
}
