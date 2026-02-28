import { DeliverableType } from '@/data/deliverables';
import { deliverableTypes } from '@/data/deliverable-types';

const toVar = (token: string) => `var(--${token})`;

export default function DeliverableTypeBadge({ type }: { type: DeliverableType }) {
  const config = deliverableTypes[type];
  const color = toVar(config.color);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        border: `1px solid ${color}`,
        color,
        fontSize: 11,
        fontFamily: 'var(--font-heading)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
