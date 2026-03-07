import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const dynamic = 'force-dynamic';

const OPENCLAW = '/opt/homebrew/bin/openclaw';

export async function GET() {
  try {
    const output = execSync(`${OPENCLAW} agents list 2>&1`, { encoding: 'utf-8', timeout: 10000 });
    const models: Record<string, string> = {};

    // Parse each agent block: "- agentId ... Model: provider/model"
    const agentBlocks = output.split(/^- /m).filter(Boolean);
    for (const block of agentBlocks) {
      const idMatch = block.match(/^(\w+)/);
      const modelMatch = block.match(/Model:\s*(\S+)/);
      if (idMatch && modelMatch) {
        models[idMatch[1]] = modelMatch[1];
      }
    }

    return NextResponse.json(models);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { agentId, model } = await request.json();

    if (!agentId || !model) {
      return NextResponse.json({ error: 'agentId and model are required' }, { status: 400 });
    }

    // Validate agentId format (alphanumeric + hyphens only)
    if (!/^[a-zA-Z0-9-]+$/.test(agentId) || !/^[a-zA-Z0-9/_.-]+$/.test(model)) {
      return NextResponse.json({ error: 'Invalid agentId or model format' }, { status: 400 });
    }

    execSync(`${OPENCLAW} models set --agent ${agentId} ${model}`, {
      encoding: 'utf-8',
      timeout: 10000,
    });

    return NextResponse.json({ ok: true, agentId, model });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
