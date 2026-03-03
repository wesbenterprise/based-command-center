import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function groupRows(rows: any[], groupBy: string) {
  const map = new Map<string, any>();
  rows.forEach(row => {
    let key = 'all';
    if (groupBy === 'day') key = new Date(row.recorded_at).toISOString().slice(0, 10);
    if (groupBy === 'hour') key = new Date(row.recorded_at).toISOString().slice(0, 13) + ':00';
    if (groupBy === 'model') key = row.model || 'unknown';
    if (groupBy === 'agent') key = row.agent_id || 'unknown';
    if (!map.has(key)) map.set(key, { key, tokens_in: 0, tokens_out: 0, cost_usd: 0, requests: 0 });
    const entry = map.get(key);
    entry.tokens_in += row.tokens_in || 0;
    entry.tokens_out += row.tokens_out || 0;
    entry.cost_usd += row.cost_usd || 0;
    entry.requests += 1;
  });
  return Array.from(map.values());
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agent = searchParams.get('agent');
  const model = searchParams.get('model');
  const since = searchParams.get('since');
  const until = searchParams.get('until');
  const groupBy = searchParams.get('group_by');

  let query = supabase
    .from('token_usage')
    .select('*')
    .order('recorded_at', { ascending: true });

  if (agent) query = query.eq('agent_id', agent);
  if (model) query = query.eq('model', model);
  if (since) query = query.gte('recorded_at', since);
  if (until) query = query.lte('recorded_at', until);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = data || [];

  if (groupBy) {
    const grouped = groupRows(rows, groupBy);
    return NextResponse.json({ data: grouped, group_by: groupBy });
  }

  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const rows = Array.isArray(payload) ? payload : [payload];
  const { data, error } = await supabase
    .from('token_usage')
    .insert(rows)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
