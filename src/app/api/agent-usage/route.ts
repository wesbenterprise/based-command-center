import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface UsageRow {
  strategy: string;
  results: string;
  api_cost: number;
  created_at: string;
}

interface UsageStats {
  tokens_in: number;
  tokens_out: number;
  total_tokens: number;
  cost_usd: number;
  sessions: number;
}

function emptyStats(): UsageStats {
  return { tokens_in: 0, tokens_out: 0, total_tokens: 0, cost_usd: 0, sessions: 0 };
}

function aggregateRows(rows: UsageRow[]): UsageStats {
  const stats = emptyStats();
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.results);
      stats.tokens_in += parsed.tokens_in || 0;
      stats.tokens_out += parsed.tokens_out || 0;
      stats.cost_usd += row.api_cost || 0;
      stats.sessions += 1;
    } catch {
      stats.sessions += 1;
      stats.cost_usd += row.api_cost || 0;
    }
  }
  stats.total_tokens = stats.tokens_in + stats.tokens_out;
  stats.cost_usd = Math.round(stats.cost_usd * 100) / 100;
  return stats;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const agentId = url.searchParams.get('agent');

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('activity_log')
    .select('strategy, results, api_cost, created_at')
    .eq('goal', 'usage_tracking')
    .gte('created_at', monthAgo)
    .order('created_at', { ascending: false });

  if (agentId) {
    query = query.eq('strategy', agentId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []) as UsageRow[];

  // If requesting a specific agent, return day/week/month breakdown
  if (agentId) {
    const dayRows = rows.filter(r => r.created_at >= dayAgo);
    const weekRows = rows.filter(r => r.created_at >= weekAgo);

    return NextResponse.json({
      agent: agentId,
      day: aggregateRows(dayRows),
      week: aggregateRows(weekRows),
      month: aggregateRows(rows),
    });
  }

  // Otherwise return all agents' summaries
  const byAgent: Record<string, UsageRow[]> = {};
  for (const row of rows) {
    if (!byAgent[row.strategy]) byAgent[row.strategy] = [];
    byAgent[row.strategy].push(row);
  }

  const result: Record<string, { day: UsageStats; week: UsageStats; month: UsageStats }> = {};
  for (const [agent, agentRows] of Object.entries(byAgent)) {
    const dayRows = agentRows.filter(r => r.created_at >= dayAgo);
    const weekRows = agentRows.filter(r => r.created_at >= weekAgo);
    result[agent] = {
      day: aggregateRows(dayRows),
      week: aggregateRows(weekRows),
      month: aggregateRows(agentRows),
    };
  }

  return NextResponse.json(result);
}
