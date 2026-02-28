import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DeliverableFeed from '@/components/deliverables/DeliverableFeed';
import { deliverables } from '@/data/deliverables';

const tabs = [
  { id: 'hq', label: 'HQ', icon: '🏠', href: '/' },
  { id: 'ops', label: 'Ops', icon: '⚡', href: '/?tab=ops' },
  { id: 'intel', label: 'Intel', icon: '📊', href: '/?tab=intel' },
  { id: 'output', label: 'Output', icon: '📦', href: '/output' },
  { id: 'apps', label: 'Apps', icon: '🧩', href: '/?tab=apps' },
  { id: 'chat', label: 'Chat', icon: '💬', href: '/?tab=chat' },
];

export default function OutputPage() {
  const draftCount = deliverables.filter(d => d.status === 'draft').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px', borderBottom: '1px solid rgba(255,0,255,0.15)',
        background: 'rgba(10,10,10,0.9)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo.png" alt="BASeD" width={40} height={40} style={{ borderRadius: 4 }} />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18, letterSpacing: '0.1em' }}>
              <span className="neon-magenta">BASeD</span>{' '}
              <span style={{ color: 'var(--text-secondary)' }}>COMMAND CENTER</span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
              v3.0 — ALL SYSTEMS NOMINAL <span className="pulse-dot" style={{ marginLeft: 6 }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--accent-amber)' }}>🔥 1</span>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            Lv.1 Operator · 0 XP
            <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.1)', marginTop: 2, borderRadius: 2 }}>
              <div style={{
                width: '5%', height: '100%', background: 'linear-gradient(90deg, var(--accent-magenta), var(--accent-cyan))',
                borderRadius: 2, backgroundSize: '200px 100%', animation: 'xpShimmer 2s linear infinite',
              }} />
            </div>
          </div>
        </div>
      </header>

      <nav style={{ display: 'flex', justifyContent: 'center', gap: 4, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,10,10,0.6)' }}>
        {tabs.map(tab => (
          <Link
            key={tab.id}
            href={tab.href}
            className={`tab-btn ${tab.id === 'output' ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            {tab.icon} {tab.label}
            {tab.id === 'output' && draftCount > 0 && (
              <span style={{ marginLeft: 6, fontSize: 12, color: 'var(--accent-amber)' }}>{draftCount}</span>
            )}
          </Link>
        ))}
      </nav>

      <main style={{ flex: 1, padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Suspense fallback={<div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 18, textAlign: 'center', padding: 40 }}>Loading deliverables...</div>}>
            <DeliverableFeed />
          </Suspense>
        </div>
      </main>

      <div style={{
        position: 'sticky', bottom: 0, zIndex: 100,
        borderTop: '1px solid rgba(255,0,255,0.2)',
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: 'var(--accent-magenta)', fontFamily: 'var(--font-body)', fontSize: 18 }}>&gt; _</span>
        <input
          placeholder="Type a command..."
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: 18,
            caretColor: 'var(--accent-cyan)',
          }}
        />
      </div>
    </div>
  );
}
