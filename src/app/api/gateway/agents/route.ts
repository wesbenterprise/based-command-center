import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('openclaw config get agents --json 2>/dev/null || openclaw config get agents 2>/dev/null');
    const data = JSON.parse(stdout);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: 'Gateway offline', detail: e.message }, { status: 503 });
  }
}
