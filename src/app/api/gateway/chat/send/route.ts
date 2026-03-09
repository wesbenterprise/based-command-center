import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';

// Map command center agent IDs to gateway agent IDs
const agentIdMap: Record<string, string> = { ace: 'main' };

export async function POST(req: NextRequest) {
  try {
    const { agentId, message } = await req.json();
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const gatewayAgent = agentIdMap[agentId] || agentId;

    // Use openclaw agent CLI to send message and get response
    // --json gives us structured output
    const escaped = message.replace(/'/g, "'\\''");
    const cmd = `openclaw agent --agent ${gatewayAgent} --message '${escaped}' --json --timeout 120`;
    
    const result = execSync(cmd, { 
      timeout: 130000, 
      encoding: 'utf8',
      env: { ...process.env, PATH: process.env.PATH + ':/opt/homebrew/bin:/usr/local/bin' },
    });

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      // If not JSON, treat the raw output as the response text
      parsed = { reply: result.trim() };
    }

    return NextResponse.json({
      success: true,
      reply: parsed.reply || parsed.text || parsed.content || result.trim(),
      raw: parsed,
    });
  } catch (e: any) {
    const stderr = e.stderr?.toString() || '';
    const stdout = e.stdout?.toString() || '';
    return NextResponse.json({ 
      error: 'Failed to send message', 
      detail: e.message,
      stderr: stderr.slice(0, 500),
      stdout: stdout.slice(0, 500),
    }, { status: 500 });
  }
}
