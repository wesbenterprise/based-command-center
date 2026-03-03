'use client';

import { useCallback, useEffect, useState } from 'react';

interface AlertRule {
  id: string;
  name: string;
  rule_type: string;
  severity?: string;
  enabled?: boolean;
  config?: any;
  created_at?: string;
}

const ruleTypes = ['agent_offline', 'cost_spike', 'error_rate', 'task_stalled'];

export default function AlertRulesConfig() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ name: '', rule_type: 'agent_offline', severity: 'warn', config: '{"threshold_minutes":30}', enabled: true });
  const [editing, setEditing] = useState<Record<string, { name: string; rule_type: string; severity: string; config: string; enabled: boolean }>>({});

  const fetchRules = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/alert-rules');
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to load rules');
      setRules(json.data || []);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load rules');
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const createRule = async () => {
    try {
      const payload = {
        name: newRule.name,
        rule_type: newRule.rule_type,
        severity: newRule.severity,
        enabled: newRule.enabled,
        config: JSON.parse(newRule.config || '{}'),
      };
      const res = await fetch('/api/alert-rules', { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to create rule');
      setRules(prev => [json.data, ...prev]);
      setNewRule({ name: '', rule_type: 'agent_offline', severity: 'warn', config: '{"threshold_minutes":30}', enabled: true });
    } catch (err: any) {
      setError(err.message || 'Failed to create rule');
    }
  };

  const toggleRule = async (rule: AlertRule) => {
    const res = await fetch(`/api/alert-rules/${rule.id}`, { method: 'PATCH', body: JSON.stringify({ enabled: !rule.enabled }) });
    const json = await res.json();
    if (res.ok) setRules(prev => prev.map(r => (r.id === rule.id ? json.data : r)));
  };

  const startEdit = (rule: AlertRule) => {
    setEditing(prev => ({
      ...prev,
      [rule.id]: {
        name: rule.name,
        rule_type: rule.rule_type,
        severity: rule.severity || 'warn',
        config: JSON.stringify(rule.config || {}, null, 2),
        enabled: rule.enabled !== false,
      },
    }));
  };

  const saveEdit = async (id: string) => {
    const values = editing[id];
    if (!values) return;
    try {
      const payload = {
        name: values.name,
        rule_type: values.rule_type,
        severity: values.severity,
        enabled: values.enabled,
        config: JSON.parse(values.config || '{}'),
      };
      const res = await fetch(`/api/alert-rules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to update rule');
      setRules(prev => prev.map(r => (r.id === id ? json.data : r)));
      setEditing(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
    } catch (err: any) {
      setError(err.message || 'Failed to update rule');
    }
  };

  const deleteRule = async (id: string) => {
    const res = await fetch(`/api/alert-rules/${id}`, { method: 'DELETE' });
    if (res.ok) setRules(prev => prev.filter(r => r.id !== id));
  };

  const evaluateNow = async () => {
    await fetch('/api/alerts/evaluate', { method: 'POST' });
    fetchRules();
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h3 style={{ fontSize: 15, color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Alert Rules
        </h3>
        <button
          onClick={evaluateNow}
          style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)', fontSize: 13 }}
        >
          Evaluate Now
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>Loading rules…</div>
      ) : error ? (
        <div style={{ color: 'var(--accent-red)', fontSize: 15 }}>
          {error} <button onClick={fetchRules} style={{ marginLeft: 8, color: 'var(--accent-cyan)', background: 'transparent', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.8fr 0.6fr 0.8fr', gap: 12, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Name</span><span>Type</span><span>Severity</span><span>Enabled</span><span>Actions</span>
          </div>
          {rules.map(rule => (
            <div key={rule.id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 0.8fr 0.6fr 0.8fr', gap: 12, alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-cyan)' }}>{rule.name}</span>
                <span>{rule.rule_type}</span>
                <span>{rule.severity || 'warn'}</span>
                <button onClick={() => toggleRule(rule)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: rule.enabled === false ? 'var(--text-muted)' : 'var(--accent-green)', padding: '4px 10px', cursor: 'pointer' }}>
                  {rule.enabled === false ? 'Off' : 'On'}
                </button>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(rule)} style={{ background: 'transparent', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteRule(rule.id)} style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              {editing[rule.id] && (
                <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  <input
                    value={editing[rule.id].name}
                    onChange={e => setEditing(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], name: e.target.value } }))}
                    placeholder="Rule name"
                    style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
                  />
                  <select
                    value={editing[rule.id].rule_type}
                    onChange={e => setEditing(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], type: e.target.value } }))}
                    style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
                  >
                    {ruleTypes.map(t => (<option key={t} value={t}>{t}</option>))}
                  </select>
                  <input
                    value={editing[rule.id].severity}
                    onChange={e => setEditing(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], severity: e.target.value } }))}
                    placeholder="severity"
                    style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
                  />
                  <textarea
                    value={editing[rule.id].config}
                    onChange={e => setEditing(prev => ({ ...prev, [rule.id]: { ...prev[rule.id], config: e.target.value } }))}
                    rows={4}
                    style={{ gridColumn: '1 / -1', background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: 6 }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(rule.id)} style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '6px 12px', cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditing(prev => { const copy = { ...prev }; delete copy[rule.id]; return copy; })} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>New Rule</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              <input
                value={newRule.name}
                onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Rule name"
                style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
              />
              <select
                value={newRule.rule_type}
                onChange={e => setNewRule(prev => ({ ...prev, rule_type: e.target.value }))}
                style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
              >
                {ruleTypes.map(t => (<option key={t} value={t}>{t}</option>))}
              </select>
              <input
                value={newRule.severity}
                onChange={e => setNewRule(prev => ({ ...prev, severity: e.target.value }))}
                placeholder="severity"
                style={{ background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '6px 10px', borderRadius: 6 }}
              />
              <textarea
                value={newRule.config}
                onChange={e => setNewRule(prev => ({ ...prev, config: e.target.value }))}
                rows={3}
                style={{ gridColumn: '1 / -1', background: 'rgba(10,12,18,0.8)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', padding: '8px', borderRadius: 6 }}
              />
              <button onClick={createRule} style={{ background: 'transparent', border: '1px solid var(--accent-green)', color: 'var(--accent-green)', padding: '6px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
                Add Rule
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
