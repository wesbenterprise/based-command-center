'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  { id: 'hq', label: 'HQ', icon: '🏠', href: '/' },
  { id: 'chat', label: 'CHAT', icon: '💬', href: '/chat' },
  { id: 'skills', label: 'SKILLS', icon: '🧠', href: '/skills' },
  { id: 'cron', label: 'CRON', icon: '⚡', href: '/cron' },
  { id: 'intel', label: 'INTEL', icon: '📊', href: '/intel' },
  { id: 'output', label: 'OUTPUT', icon: '📦', href: '/output' },
  { id: 'surveys', label: 'SURVEYS', icon: '📋', href: '/surveys' },
  { id: 'apps', label: 'APPS', icon: '🧩', href: '/apps' },
  { id: 'system', label: 'SYSTEM', icon: '🔧', href: '/system' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navContent = (
    <>
      {navItems.map(item => (
        <Link
          key={item.id}
          href={item.href}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px',
            textDecoration: 'none',
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            letterSpacing: '0.08em',
            color: isActive(item.href) ? 'var(--accent-magenta)' : 'var(--text-secondary)',
            background: isActive(item.href) ? 'rgba(255,0,255,0.08)' : 'transparent',
            borderLeft: isActive(item.href) ? '3px solid var(--accent-magenta)' : '3px solid transparent',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (!isActive(item.href)) {
              e.currentTarget.style.color = 'var(--accent-cyan)';
              e.currentTarget.style.background = 'rgba(0,255,255,0.05)';
            }
          }}
          onMouseLeave={e => {
            if (!isActive(item.href)) {
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 220,
        background: 'rgba(12,12,15,0.97)',
        borderRight: '1px solid rgba(255,0,255,0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        backdropFilter: 'blur(16px)',
      }} className="sidebar-desktop">
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,0,255,0.1)',
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Image src="/assets/logo.png" alt="BASeD" width={36} height={36} style={{ borderRadius: 4 }} />
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, letterSpacing: '0.1em' }}>
                <span className="neon-magenta">BASeD</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
                COMMAND CENTER
              </div>
            </div>
          </Link>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em', marginTop: 6, paddingLeft: 46 }}>
            v3.1
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navContent}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,0,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
            ALL SYSTEMS NOMINAL
          </span>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="sidebar-mobile-header" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 56,
        background: 'rgba(12,12,15,0.97)',
        borderBottom: '1px solid rgba(255,0,255,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 60,
        backdropFilter: 'blur(16px)',
      }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Image src="/assets/logo.png" alt="BASeD" width={32} height={32} style={{ borderRadius: 4 }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '0.1em' }}>
            <span className="neon-magenta">BASeD</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
            fontSize: 20,
            padding: '6px 10px',
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {mobileOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 55,
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <nav
        className="sidebar-mobile-drawer"
        style={{
          position: 'fixed',
          top: 56,
          left: 0,
          bottom: 0,
          width: 260,
          background: 'rgba(12,12,15,0.98)',
          borderRight: '1px solid rgba(255,0,255,0.15)',
          zIndex: 56,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 12,
          overflowY: 'auto',
        }}
      >
        {navContent}
        <div style={{ padding: '16px', marginTop: 'auto', borderTop: '1px solid rgba(255,0,255,0.1)' }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.1em' }}>
            v3.1 <span className="pulse-dot" style={{ marginLeft: 6 }} /> NOMINAL
          </span>
        </div>
      </nav>
    </>
  );
}
