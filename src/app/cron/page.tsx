'use client';

import BriefingSettings from '@/components/cron/BriefingSettings';

export default function CronPage() {
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <h2 style={{
        fontSize: 20,
        color: 'var(--accent-magenta)',
        margin: '0 0 20px 0',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        fontFamily: 'var(--font-heading)',
      }}>
        CRON Jobs
      </h2>
      <BriefingSettings />
    </main>
  );
}
