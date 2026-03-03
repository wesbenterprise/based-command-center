import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function startOfDay(dateStr: string) {
  return new Date(dateStr + 'T00:00:00Z');
}

function endOfDay(dateStr: string) {
  const start = startOfDay(dateStr);
  return new Date(start.getTime() + 24 * 3600000);
}

function nextDue(lastRun: string | null, frequency: string): Date | null {
  if (!lastRun) return null;
  const date = new Date(lastRun);
  const freq = (frequency || '').toLowerCase();
  if (freq === 'daily') date.setDate(date.getDate() + 1);
  if (freq === 'weekly') date.setDate(date.getDate() + 7);
  if (freq === 'monthly') date.setMonth(date.getMonth() + 1);
  if (freq === 'quarterly') date.setMonth(date.getMonth() + 3);
  if (freq === 'annual' || freq === 'yearly') date.setFullYear(date.getFullYear() + 1);
  return date;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const date = body?.date || new Date().toISOString().slice(0, 10);
  const start = startOfDay(date).toISOString();
  const end = endOfDay(date).toISOString();

  const [activityRes, usageRes, alertRes, ordersRes] = await Promise.all([
    supabase.from('activity_feed').select('*').gte('created_at', start).lt('created_at', end),
    supabase.from('token_usage').select('*').gte('recorded_at', start).lt('recorded_at', end),
    supabase.from('alert_evaluations').select('*').gte('triggered_at', start).lt('triggered_at', end),
    supabase.from('standing_orders').select('*'),
  ]);

  if (activityRes.error || usageRes.error || alertRes.error || ordersRes.error) {
    return NextResponse.json({ error: activityRes.error?.message || usageRes.error?.message || alertRes.error?.message || ordersRes.error?.message }, { status: 500 });
  }

  const activity = activityRes.data || [];
  const usage = usageRes.data || [];
  const alerts = alertRes.data || [];
  const orders = ordersRes.data || [];

  const agentMap = new Map<string, { agent_id: string; agent_name: string; activities: string[]; tokens: number; cost: number }>();

  activity.forEach(row => {
    if (!agentMap.has(row.agent_id)) {
      agentMap.set(row.agent_id, { agent_id: row.agent_id, agent_name: row.agent_name || row.agent_id, activities: [], tokens: 0, cost: 0 });
    }
    agentMap.get(row.agent_id)!.activities.push(row.description);
  });

  usage.forEach(row => {
    const key = row.agent_id || 'unknown';
    if (!agentMap.has(key)) {
      agentMap.set(key, { agent_id: key, agent_name: key, activities: [], tokens: 0, cost: 0 });
    }
    const entry = agentMap.get(key)!;
    entry.tokens += (row.tokens_in || 0) + (row.tokens_out || 0);
    entry.cost += row.cost_usd || 0;
  });

  const totalCost = usage.reduce((sum, row) => sum + (row.cost_usd || 0), 0);
  const highlights = activity.slice(0, 5).map(row => row.description);
  const blockers = alerts.map((a: any) => a.message).slice(0, 5);

  const overdue = orders
    .filter((order: any) => order.active !== false)
    .map((order: any) => {
      const due = nextDue(order.last_run, order.frequency);
      if (!due) return null;
      const overdueHours = (Date.now() - due.getTime()) / 3600000;
      if (overdueHours > 0) {
        return { id: order.id, name: order.name, overdue_hours: Math.round(overdueHours) };
      }
      return null;
    })
    .filter(Boolean);

  const summary = `Activities: ${activity.length} · Agents: ${agentMap.size} · Cost: $${totalCost.toFixed(2)} · Alerts: ${alerts.length}`;

  const standup = {
    date,
    summary,
    agents: Array.from(agentMap.values()),
    highlights,
    blockers,
    alerts: alerts.map((a: any) => ({ id: a.id, message: a.message, severity: a.severity })),
    overdue,
  };

  const { data, error } = await supabase
    .from('standups')
    .upsert([{ date, summary, content: standup }], { onConflict: 'date' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
