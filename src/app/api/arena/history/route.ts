import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10);

  const { data: runs, error: runsErr } = await supabase
    .from('prompt_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (runsErr) {
    return NextResponse.json({ error: runsErr.message }, { status: 500 });
  }

  if (!runs || runs.length === 0) {
    return NextResponse.json({ runs: [], responses: {} });
  }

  const runIds = runs.map((r: { id: string }) => r.id);
  const { data: responses, error: respErr } = await supabase
    .from('prompt_responses')
    .select('*')
    .in('run_id', runIds)
    .order('created_at', { ascending: true });

  if (respErr) {
    return NextResponse.json({ error: respErr.message }, { status: 500 });
  }

  // Group responses by run_id
  const responsesByRun: Record<string, unknown[]> = {};
  for (const r of (responses ?? [])) {
    const resp = r as { run_id: string };
    if (!responsesByRun[resp.run_id]) responsesByRun[resp.run_id] = [];
    responsesByRun[resp.run_id].push(r);
  }

  return NextResponse.json({ runs, responses: responsesByRun });
}
