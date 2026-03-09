'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface AgentTag { agent: string; reason: string; category?: string; }
interface FlaggedEmail {
  id: string; gmail_id: string; subject: string; sender: string; sender_domain: string;
  priority: string; agents: AgentTag[]; received_at: string; created_at: string; status: string;
}

const AGENT_EMOJI: Record<string, string> = {
  Ace: '♠️', Astra: '🌟', Rybo: '🎭', Charles: '📜', Dezayas: '🔧',
  Anderson: '📊', Pressy: '📢', Oracle: '👁️',
};
const PRIORITY_BADGE: Record<string, string> = { high: '🔴', medium: '🟡', low: '🟢', red: '🔴', yellow: '🟡', green: '🟢' };
const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, red: 0, yellow: 1, green: 2 };

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(ms / 3600000);
  if (hrs < 1) return 'just now';
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeAgoColor(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (days >= 7) return 'var(--accent-red, #ff6b6b)';
  if (days >= 3) return 'var(--accent-warm, #f97316)';
  return 'var(--text-muted)';
}

export default function EmailPage() {
  const [emails, setEmails] = useState<FlaggedEmail[]>([]);
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanOutput, setScanOutput] = useState('');
  const [lastScan, setLastScan] = useState('');
  const [reviewedOpen, setReviewedOpen] = useState(false);
  const [agentFilter, setAgentFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'oldest'>('priority');

  useEffect(() => { fetchEmails(); }, []);

  async function fetchEmails() {
    setLoading(true);
    try {
      const res = await fetch('/api/email/list');
      const data = await res.json();
      if (data.emails) setEmails(data.emails);
      if (data.ratings) setRatings(data.ratings);
      setLastScan(new Date().toLocaleTimeString());
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function rateEmail(email: FlaggedEmail, rating: string) {
    setRatings(prev => ({ ...prev, [email.id]: rating }));
    await fetch('/api/email/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flagged_email_id: email.id,
        gmail_id: email.gmail_id,
        agent: email.agents?.[0]?.agent,
        rating,
        subject: email.subject,
        sender: email.sender,
        sender_domain: email.sender_domain,
        category: email.agents?.[0]?.category,
      }),
    });
  }

  async function handleRunScan() {
    setScanning(true);
    setScanOutput('');
    try {
      const res = await fetch('/api/email/scan', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setScanOutput(data.output || 'Scan complete');
        await fetchEmails();
        setLastScan(new Date().toLocaleTimeString() + ' (live scan)');
      } else {
        setScanOutput('Scan failed: ' + (data.error || 'unknown error'));
      }
    } catch (e) {
      setScanOutput('Scan error: network failure');
    }
    setScanning(false);
  }

  const filtered = useMemo(() => {
    let list = [...emails];
    if (agentFilter !== 'All') list = list.filter(e => e.agents?.some(a => a.agent === agentFilter));
    if (ratingFilter === 'Unreviewed') list = list.filter(e => !ratings[e.id]);
    else if (['great', 'ok', 'bad'].includes(ratingFilter)) list = list.filter(e => ratings[e.id] === ratingFilter);
    list.sort((a, b) => {
      if (sortBy === 'priority') {
        const pd = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
        return pd !== 0 ? pd : new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
      }
      return sortBy === 'newest'
        ? new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
        : new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
    });
    return list;
  }, [emails, agentFilter, ratingFilter, sortBy, ratings]);

  const unreviewed = filtered.filter(e => !ratings[e.id]);
  const reviewed = filtered.filter(e => ratings[e.id]);
  const greatCount = Object.values(ratings).filter(r => r === 'great').length;
  const okCount = Object.values(ratings).filter(r => r === 'ok').length;
  const badCount = Object.values(ratings).filter(r => r === 'bad').length;
  const unreviewedCount = emails.length - Object.keys(ratings).length;

  return (
    <main style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 13 }}>
          ← Back to HQ
        </Link>
        <h1 style={{ margin: '8px 0 0', fontFamily: 'var(--font-heading)', fontSize: 22, letterSpacing: '0.08em', color: 'var(--accent-magenta)' }}>
          📧 Email Intelligence
        </h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Surfaced by your agents · Last scan: <span style={{ color: 'var(--accent-cyan)' }}>{lastScan || '—'}</span>
        </div>
      </div>

      {/* Stats + Scan Button */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'center',
        padding: '12px 16px', marginBottom: 16, borderRadius: 6,
        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,0,255,0.15)',
        fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '0.06em',
      }}>
        <span>📧 {emails.length} surfaced</span>
        <span>⭐ {greatCount}</span>
        <span>👍 {okCount}</span>
        <span>👎 {badCount}</span>
        <span style={{ color: 'var(--accent-cyan)' }}>{unreviewedCount} unreviewed</span>
        <button onClick={handleRunScan} disabled={scanning}
          style={{
            padding: '8px 18px', borderRadius: 8, fontFamily: 'var(--font-heading)',
            fontSize: 13, letterSpacing: '0.1em', fontWeight: 'bold', cursor: scanning ? 'wait' : 'pointer',
            background: scanning ? 'rgba(0,255,255,0.1)' : 'rgba(0,255,255,0.15)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            transition: 'all 0.15s',
          }}>
          {scanning ? '⚡ SCANNING...' : '⚡ RUN SCAN NOW'}
        </button>
      </div>

      {scanOutput && (
        <div style={{
          padding: '8px 12px', marginBottom: 12, borderRadius: 4, fontSize: 12,
          background: 'rgba(0,255,0,0.08)', border: '1px solid rgba(0,255,0,0.2)',
          color: 'var(--accent-green)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto',
        }}>
          {scanOutput}
        </div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center',
        padding: '10px 14px', marginBottom: 16, borderRadius: 6,
        background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
        fontSize: 12,
      }}>
        <span style={{ color: 'var(--text-muted)', marginRight: 2 }}>Agent:</span>
        {['All', 'Ace', 'Astra', 'Rybo', 'Charles'].map(a => (
          <button key={a} onClick={() => setAgentFilter(a)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: agentFilter === a ? 'rgba(255,0,255,0.15)' : 'transparent',
              border: `1px solid ${agentFilter === a ? 'var(--accent-magenta)' : 'transparent'}`,
              color: agentFilter === a ? 'var(--accent-magenta)' : 'var(--text-muted)',
            }}>
            {a !== 'All' ? `${AGENT_EMOJI[a] || ''} ` : ''}{a}
          </button>
        ))}
        <span style={{ color: 'var(--text-muted)', marginLeft: 12, marginRight: 2 }}>Rating:</span>
        {[{ key: 'All', label: 'All' }, { key: 'Unreviewed', label: 'New' }, { key: 'great', label: '⭐' }, { key: 'ok', label: '👍' }, { key: 'bad', label: '👎' }].map(r => (
          <button key={r.key} onClick={() => setRatingFilter(r.key)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
              background: ratingFilter === r.key ? 'rgba(0,255,255,0.15)' : 'transparent',
              border: `1px solid ${ratingFilter === r.key ? 'var(--accent-cyan)' : 'transparent'}`,
              color: ratingFilter === r.key ? 'var(--accent-cyan)' : 'var(--text-muted)',
            }}>
            {r.label}
          </button>
        ))}
        <span style={{ color: 'var(--text-muted)', marginLeft: 12, marginRight: 2 }}>Sort:</span>
        {(['priority', 'newest', 'oldest'] as const).map(s => (
          <button key={s} onClick={() => setSortBy(s)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize',
              background: sortBy === s ? 'rgba(255,0,255,0.15)' : 'transparent',
              border: `1px solid ${sortBy === s ? 'var(--accent-magenta)' : 'transparent'}`,
              color: sortBy === s ? 'var(--accent-magenta)' : 'var(--text-muted)',
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div style={{ textAlign: 'center', padding: 40, color: 'var(--accent-magenta)', fontSize: 16, fontFamily: 'var(--font-heading)' }}>LOADING INTELLIGENCE...</div>}

      {!loading && (
        <>
          <h2 style={{ fontSize: 14, fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', color: 'var(--accent-cyan)', marginBottom: 12 }}>
            UNREVIEWED ({unreviewed.length})
          </h2>

          {unreviewed.length === 0 && (
            <div style={{
              padding: 32, textAlign: 'center', borderRadius: 6,
              background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)', fontSize: 14, marginBottom: 16,
            }}>
              {emails.length === 0 ? 'No emails surfaced yet. Run a scan.' : 'All caught up!'}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {unreviewed.map(email => (
              <EmailCard key={email.id} email={email} rating={ratings[email.id]} onRate={rateEmail} />
            ))}
          </div>

          {reviewed.length > 0 && (
            <>
              <button onClick={() => setReviewedOpen(!reviewedOpen)}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  fontSize: 14, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', marginBottom: 12,
                  textAlign: 'left', width: '100%',
                }}>
                {reviewedOpen ? '▼' : '▶'} REVIEWED ({reviewed.length})
                <span style={{ marginLeft: 12, fontSize: 12 }}>
                  ⭐ {reviewed.filter(e => ratings[e.id] === 'great').length} · 
                  👍 {reviewed.filter(e => ratings[e.id] === 'ok').length} · 
                  👎 {reviewed.filter(e => ratings[e.id] === 'bad').length}
                </span>
              </button>
              {reviewedOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reviewed.map(email => (
                    <EmailCard key={email.id} email={email} rating={ratings[email.id]} onRate={rateEmail} />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}

function EmailCard({ email, rating, onRate }: { email: FlaggedEmail; rating?: string; onRate: (e: FlaggedEmail, r: string) => void }) {
  const borderColor = rating === 'great' ? 'rgba(255,215,0,0.3)' : rating === 'bad' ? 'rgba(255,100,100,0.3)' : 'rgba(255,0,255,0.12)';
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
      background: 'rgba(0,0,0,0.3)', border: `1px solid ${borderColor}`,
    }}
      onClick={() => window.open(`https://mail.google.com/mail/u/0/#inbox/${email.gmail_id}`, '_blank')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>{PRIORITY_BADGE[email.priority] || '🟢'}</span>
            <span style={{ fontWeight: 'bold', fontSize: 14, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {email.subject}
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{email.sender}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {(email.agents || []).map((a, i) => (
              <span key={i} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 4,
                background: 'rgba(255,0,255,0.1)', color: 'var(--accent-magenta)',
              }}>
                {AGENT_EMOJI[a.agent] || '🤖'} {a.agent}: {a.reason}
              </span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: timeAgoColor(email.received_at || email.created_at) }}>
            {timeAgo(email.received_at || email.created_at)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
        {(['great', 'ok', 'bad'] as const).map(r => {
          const label = r === 'great' ? '⭐ Great' : r === 'ok' ? '👍 OK' : '👎 Bad';
          const active = rating === r;
          const activeColor = r === 'great' ? 'rgba(255,215,0,0.3)' : r === 'ok' ? 'rgba(0,255,0,0.2)' : 'rgba(255,100,100,0.2)';
          return (
            <button key={r}
              onClick={e => { e.stopPropagation(); onRate(email, r); }}
              style={{
                padding: '4px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                background: active ? activeColor : 'rgba(255,255,255,0.05)',
                border: `1px solid ${active ? (r === 'great' ? 'gold' : r === 'ok' ? 'var(--accent-green)' : 'var(--accent-red, #ff6b6b)') : 'rgba(255,255,255,0.1)'}`,
                color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              }}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
