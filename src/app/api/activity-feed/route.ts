import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 200);
  const agent = searchParams.get('agent');
  const type = searchParams.get('type');
  const since = searchParams.get('since');

  let query = supabase
    .from('activity_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (agent) query = query.eq('agent_id', agent);
  if (type) query = query.eq('activity_type', type);
  if (since) query = query.gte('created_at', since);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const { data, error } = await supabase
    .from('activity_feed')
    .insert([payload])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
