'use client';

import TokenUsageDashboard from '@/components/usage/TokenUsageDashboard';
import AlertRulesConfig from '@/components/alerts/AlertRulesConfig';
import ConnectionHealth from '@/components/system/ConnectionHealth';

export default function SystemPage() {
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ConnectionHealth />
        <TokenUsageDashboard />
        <AlertRulesConfig />
      </div>
    </main>
  );
}
