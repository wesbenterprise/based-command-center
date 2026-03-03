'use client';

import TokenUsageDashboard from '@/components/usage/TokenUsageDashboard';
import LogViewer from '@/components/logs/LogViewer';
import AlertRulesConfig from '@/components/alerts/AlertRulesConfig';

export default function SystemTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <TokenUsageDashboard />
      <LogViewer />
      <AlertRulesConfig />
    </div>
  );
}
