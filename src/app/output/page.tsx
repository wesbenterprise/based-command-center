import { Suspense } from 'react';
import DeliverableFeed from '@/components/deliverables/DeliverableFeed';

export default function OutputPage() {
  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      <Suspense fallback={<div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontSize: 18, textAlign: 'center', padding: 40 }}>Loading deliverables...</div>}>
        <DeliverableFeed />
      </Suspense>
    </main>
  );
}
