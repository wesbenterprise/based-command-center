import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { data, error } = await supabase
    .from('agents')
    .select('id, updated_at');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const heartbeats: Record<string, string> = {};
  for (const row of data || []) {
    heartbeats[row.id] = row.updated_at;
  }

  return NextResponse.json(heartbeats);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { agentId } = body;

  if (!agentId) {
    return NextResponse.json({ error: 'agentId required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('agents')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', agentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
