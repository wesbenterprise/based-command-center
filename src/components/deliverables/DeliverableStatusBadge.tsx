import { DeliverableStatus } from '@/data/deliverables';
import { deliverableStatuses } from '@/data/deliverable-types';

const toVar = (token: string) => `var(--${token})`;

export default function DeliverableStatusBadge({ status }: { status: DeliverableStatus }) {
  if (status === 'live') return null;

  const config = deliverableStatuses[status];
  const color = toVar(config.color);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          display: 'inline-block',
        }}
      />
      <span style={{ fontFamily: 'var(--font-heading)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {config.label}
      </span>
    </span>
  );
}
