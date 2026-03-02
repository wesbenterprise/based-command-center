import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OPENCLAW_BIN = '/opt/homebrew/bin/openclaw';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId } = body || {};

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    execSync(`${OPENCLAW_BIN} cron run ${jobId}`, { encoding: 'utf8' });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to run cron job' }, { status: 500 });
  }
}
