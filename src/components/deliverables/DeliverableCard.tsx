'use client';

import { useMemo, useState } from 'react';
import { Deliverable } from '@/data/deliverables';
import { deliverableTypes } from '@/data/deliverable-types';
import DeliverableTypeBadge from './DeliverableTypeBadge';
import DeliverableStatusBadge from './DeliverableStatusBadge';
import DeliverableAgentTag from './DeliverableAgentTag';
import DeliverableActions from './DeliverableActions';

const toVar = (token: string) => `var(--${token})`;

export default function DeliverableCard({ deliverable, compact = false }: { deliverable: Deliverable; compact?: boolean }) {
  const [hover, setHover] = useState(false);
  const hoverColor = useMemo(() => toVar(deliverableTypes[deliverable.type].color), [deliverable.type]);

  const createdLabel = new Date(deliverable.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const metaParts = [
    deliverable.projectLabel ? `Project: ${deliverable.projectLabel}` : deliverable.project ? `Project: ${deliverable.project}` : null,
    deliverable.format ? `Format: ${deliverable.format}` : null,
    deliverable.fileSize ? `Size: ${deliverable.fileSize}` : null,
  ].filter(Boolean);

  return (
    <div
      className="panel"
      style={{
        padding: compact ? 16 : 20,
        borderRadius: 8,
        opacity: deliverable.status === 'archived' ? 0.6 : 1,
        borderColor: hover ? hoverColor : 'var(--border-subtle)',
        boxShadow: hover ? `0 0 12px ${hoverColor}` : undefined,
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
        animation: 'fadeIn 0.2s ease',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <DeliverableTypeBadge type={deliverable.type} />
          <DeliverableStatusBadge status={deliverable.status} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{createdLabel}</div>
      </div>

      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: compact ? 18 : 20,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: deliverable.status === 'archived' ? 'line-through' : 'none',
          }}
        >
          {deliverable.name}
        </h3>
        {deliverable.version && (
          <span
            style={{
              border: '1px solid var(--text-muted)',
              color: 'var(--text-muted)',
              padding: '2px 8px',
              fontSize: 11,
              fontFamily: 'var(--font-heading)',
              letterSpacing: '0.08em',
            }}
          >
            {deliverable.version}
          </span>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <DeliverableAgentTag agentId={deliverable.agentId} />
      </div>

      {!compact && (
        <p style={{ margin: '10px 0 0 0', fontSize: 16, color: 'var(--text-secondary)' }}>
          {deliverable.description}
        </p>
      )}

      {metaParts.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>
          {metaParts.join(' · ')}
        </div>
      )}

      {!compact && (
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end' }}>
          <DeliverableActions deliverable={deliverable} />
        </div>
      )}
    </div>
  );
}
