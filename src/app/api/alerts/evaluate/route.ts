import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3600000).toISOString();
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60000).toISOString();
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

export async function POST() {
  const { data: rules, error: rulesError } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('enabled', true);

  if (rulesError) return NextResponse.json({ error: rulesError.message }, { status: 500 });

  const { data: existingAlerts } = await supabase
    .from('alert_evaluations')
    .select('id, rule_id, message, status')
    .eq('status', 'active');

  const activeMessages = new Set((existingAlerts || []).map(a => `${a.rule_id}:${a.message}`));
  const triggered: any[] = [];

  for (const rule of rules || []) {
    const config = typeof rule.config === 'string' ? JSON.parse(rule.config) : (rule.config || {});
    const severity = rule.severity || 'warn';

    if (rule.rule_type === 'agent_offline') {
      const threshold = Number(config.threshold_minutes || 30);
      const { data: agents } = await supabase.from('agents').select('id, updated_at');
      (agents || []).forEach(agent => {
        const last = agent.updated_at ? new Date(agent.updated_at).getTime() : 0;
        const mins = (Date.now() - last) / 60000;
        if (mins > threshold) {
          const message = `${agent.id} offline for ${Math.round(mins)}m`;
          const key = `${rule.id}:${message}`;
          if (!activeMessages.has(key)) {
            triggered.push({ rule_id: rule.id, rule_name: rule.name, status: 'active', severity, message, details: { agent_id: agent.id, minutes: Math.round(mins) } });
            activeMessages.add(key);
          }
        }
      });
    }

    if (rule.rule_type === 'cost_spike') {
      const windowHours = Number(config.window_hours || 24);
      const thresholdUsd = Number(config.threshold_usd || 0);
      const { data: usage } = await supabase
        .from('token_usage')
        .select('cost_usd')
        .gte('recorded_at', hoursAgo(windowHours));
      const cost = (usage || []).reduce((sum, row) => sum + (row.cost_usd || 0), 0);
      if (cost > thresholdUsd) {
        const message = `Cost spike: $${cost.toFixed(2)} in last ${windowHours}h`;
        const key = `${rule.id}:${message}`;
        if (!activeMessages.has(key)) {
          triggered.push({ rule_id: rule.id, rule_name: rule.name, status: 'active', severity, message, details: { cost_usd: cost, window_hours: windowHours } });
          activeMessages.add(key);
        }
      }
    }

    if (rule.rule_type === 'error_rate') {
      const windowHours = Number(config.window_hours || 24);
      const thresholdCount = Number(config.threshold_count || 1);
      const { count } = await supabase
        .from('agent_logs')
        .select('id', { count: 'exact', head: true })
        .eq('level', 'error')
        .gte('created_at', hoursAgo(windowHours));
      if ((count || 0) > thresholdCount) {
        const message = `Error rate: ${count} errors in last ${windowHours}h`;
        const key = `${rule.id}:${message}`;
        if (!activeMessages.has(key)) {
          triggered.push({ rule_id: rule.id, rule_name: rule.name, status: 'active', severity, message, details: { count, window_hours: windowHours } });
          activeMessages.add(key);
        }
      }
    }

    if (rule.rule_type === 'task_stalled') {
      const graceHours = Number(config.grace_hours || 0);
      const { data: orders } = await supabase.from('standing_orders').select('id, name, frequency, last_run, active');
      (orders || []).forEach(order => {
        if (order.active === false) return;
        const due = nextDue(order.last_run, order.frequency);
        if (!due) return;
        const overdueHours = (Date.now() - due.getTime()) / 3600000;
        if (overdueHours > graceHours) {
          const message = `Task stalled: ${order.name} overdue by ${Math.round(overdueHours)}h`;
          const key = `${rule.id}:${message}`;
          if (!activeMessages.has(key)) {
            triggered.push({ rule_id: rule.id, rule_name: rule.name, status: 'active', severity, message, details: { task_id: order.id, overdue_hours: Math.round(overdueHours) } });
            activeMessages.add(key);
          }
        }
      });
    }
  }

  if (triggered.length) {
    const { error } = await supabase
      .from('alert_evaluations')
      .insert(triggered);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ triggered: triggered.length });
}
