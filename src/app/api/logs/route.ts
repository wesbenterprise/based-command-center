import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');
  const agent = searchParams.get('agent');
  const source = searchParams.get('source');
  const search = searchParams.get('search');
  const since = searchParams.get('since');
  const limit = Math.min(Number(searchParams.get('limit') || 200), 500);

  let query = supabase
    .from('agent_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (level && level !== 'all') query = query.eq('level', level);
  if (agent) query = query.eq('agent_id', agent);
  if (source) query = query.ilike('source', `%${source}%`);
  if (search) query = query.or(`message.ilike.%${search}%,source.ilike.%${search}%`);
  if (since) query = query.gte('created_at', since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const rows = Array.isArray(payload) ? payload : [payload];
  const { data, error } = await supabase
    .from('agent_logs')
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
