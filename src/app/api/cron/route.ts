import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const OPENCLAW_BIN = '/opt/homebrew/bin/openclaw';

function listJobs() {
  const raw = execSync(`${OPENCLAW_BIN} cron list --json`, { encoding: 'utf8' });
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.jobs)) return parsed.jobs;
  return [];
}

export async function GET() {
  try {
    const jobs = listJobs();
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to list cron jobs' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { jobId, patch } = body || {};

    if (!jobId || !patch) {
      return NextResponse.json({ error: 'jobId and patch required' }, { status: 400 });
    }

    const args: string[] = [];
    if (patch.cron) {
      args.push(`--cron ${JSON.stringify(patch.cron)}`);
    }
    if (patch.tz) {
      args.push(`--tz ${JSON.stringify(patch.tz)}`);
    }
    if (patch.message) {
      args.push(`--message ${JSON.stringify(patch.message)}`);
    }

    if (args.length) {
      execSync(`${OPENCLAW_BIN} cron edit ${jobId} ${args.join(' ')}`, { encoding: 'utf8' });
    }

    if (typeof patch.enabled === 'boolean') {
      execSync(`${OPENCLAW_BIN} cron ${patch.enabled ? 'enable' : 'disable'} ${jobId}`, { encoding: 'utf8' });
    }

    const jobs = listJobs();
    return NextResponse.json(jobs);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update cron job' }, { status: 500 });
  }
}
