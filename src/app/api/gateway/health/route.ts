import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw gateway status 2>&1');
    const isRunning = stdout.includes('18789') || stdout.includes('Listening') || stdout.includes('RPC probe: ok');
    
    // Get version
    let version = 'unknown';
    try {
      const { stdout: vOut } = await execAsync('openclaw --version 2>/dev/null');
      version = vOut.trim();
    } catch {}

    // Get uptime from process
    let uptime = 'unknown';
    try {
      const { stdout: psOut } = await execAsync("ps -o etime= -p $(lsof -ti :18789 2>/dev/null | head -1) 2>/dev/null");
      uptime = psOut.trim();
    } catch {}

    return NextResponse.json({
      status: isRunning ? 'connected' : 'disconnected',
      version,
      uptime,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    return NextResponse.json({ status: 'disconnected', error: e.message }, { status: 503 });
  }
}
