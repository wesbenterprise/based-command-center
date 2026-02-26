import { Entity } from '../../types/entities';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS, STATUS_COLORS, needsCriticalAccent } from './entityStyles';

interface EntityCardProps {
  entity: Entity;
  onSelect: (entity: Entity) => void;
  onEdit: (entity: Entity) => void;
}

export default function EntityCard({ entity, onSelect, onEdit }: EntityCardProps) {
  const color = ENTITY_TYPE_COLORS[entity.type];
  const label = ENTITY_TYPE_LABELS[entity.type];
  const statusColor = STATUS_COLORS[entity.status] || 'var(--text-muted)';
  const critical = needsCriticalAccent(entity.agent_instructions);
  const instructionBorder = critical ? 'var(--accent-red)' : color;
  const instructions = entity.agent_instructions || '';
  const truncated = instructions.length > 140 ? `${instructions.slice(0, 140)}…` : instructions;
  const relationshipCount = (entity.outgoing?.length || 0) + (entity.incoming?.length || 0);

  return (
    <div className="panel" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: 12,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          border: `1px solid ${color}`,
          padding: '4px 8px',
          background: 'rgba(255,255,255,0.04)',
        }}>
          {label}
        </span>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
      </div>

      <div style={{ cursor: 'pointer' }} onClick={() => onSelect(entity)}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 18 }}>{entity.icon ? `${entity.icon} ` : ''}{entity.name}</div>
        {entity.full_name && entity.full_name !== entity.name && (
          <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{entity.full_name}</div>
        )}
      </div>

      {entity.description && (
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {entity.description.length > 160 ? `${entity.description.slice(0, 160)}…` : entity.description}
        </div>
      )}

      <div style={{
        borderLeft: `3px solid ${instructionBorder}`,
        background: 'rgba(255,0,255,0.05)',
        padding: '10px 12px',
      }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: instructionBorder, marginBottom: 6 }}>
          ⚡ Agent Guardrails
        </div>
        <div style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{truncated}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <button
          onClick={() => onSelect(entity)}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 15 }}
        >
          🔗 {relationshipCount} links
        </button>
        <button
          onClick={() => onEdit(entity)}
          style={{
            background: 'transparent',
            border: `1px solid ${color}`,
            color,
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'var(--font-heading)'
          }}
        >
          Edit ✎
        </button>
      </div>
    </div>
  );
}
