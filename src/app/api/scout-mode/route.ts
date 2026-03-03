import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

const OPENCLAW = '/opt/homebrew/bin/openclaw';

const MODES: Record<string, { model: string; label: string }> = {
  workhorse: { model: 'xai/grok-3-fast', label: '🐴 Workhorse' },
  bigbrain: { model: 'xai/grok-4', label: '🧠 Big Brain' },
};

export async function GET() {
  try {
    const output = execSync(`${OPENCLAW} agents list 2>&1`, { encoding: 'utf-8', timeout: 10000 });
    const scoutLine = output.split('\n').find(l => l.includes('Model:') && output.indexOf(l) > output.indexOf('scout'));
    // Parse current model from agent list
    const modelMatch = output.match(/- scout[\s\S]*?Model:\s*(\S+)/);
    const currentModel = modelMatch ? modelMatch[1] : 'unknown';
    const currentMode = currentModel.includes('grok-4') ? 'bigbrain' : 'workhorse';
    return NextResponse.json({ mode: currentMode, model: currentModel, modes: MODES });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { mode } = body;

  if (!mode || !MODES[mode]) {
    return NextResponse.json({ error: 'Invalid mode. Use "workhorse" or "bigbrain".' }, { status: 400 });
  }

  try {
    execSync(`${OPENCLAW} models set --agent scout ${MODES[mode].model}`, {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return NextResponse.json({ ok: true, mode, model: MODES[mode].model, label: MODES[mode].label });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
