import { Deliverable } from '@/data/deliverables';
import { deliverableTypes } from '@/data/deliverable-types';

const toVar = (token: string) => `var(--${token})`;

export default function DeliverableActions({ deliverable }: { deliverable: Deliverable }) {
  const color = toVar(deliverableTypes[deliverable.type].color);

  const buttonStyle = {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    padding: '6px 12px',
    fontSize: 13,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    textDecoration: 'none',
  };

  const actions = [
    deliverable.filePath && { label: '📄 View', href: deliverable.filePath },
    deliverable.downloadUrl && { label: '⬇ Download', href: deliverable.downloadUrl, download: true },
    deliverable.url && { label: '🔗 Visit', href: deliverable.url },
  ].filter(Boolean) as Array<{ label: string; href: string; download?: boolean }>;

  if (actions.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {actions.map(action => (
        <a
          key={action.label}
          href={action.href}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonStyle}
          download={action.download}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {action.label}
        </a>
      ))}
    </div>
  );
}
