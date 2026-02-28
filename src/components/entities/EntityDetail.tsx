import Link from 'next/link';
import { Entity, RelationshipEdge } from '../../types/entities';
import { deliverables } from '../../data/deliverables';
import DeliverableCard from '../deliverables/DeliverableCard';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS, RELATIONSHIP_LABELS, STATUS_COLORS, needsCriticalAccent } from './entityStyles';

interface EntityDetailProps {
  entity: Entity;
  onClose: () => void;
  onEdit: (entity: Entity) => void;
  onDelete: (entity: Entity) => void;
  onSelectEntity: (entityId: string) => void;
  onAddRelationship: () => void;
  onRemoveRelationship: (relationship: RelationshipEdge) => void;
}

export default function EntityDetail({
  entity,
  onClose,
  onEdit,
  onDelete,
  onSelectEntity,
  onAddRelationship,
  onRemoveRelationship,
}: EntityDetailProps) {
  const color = ENTITY_TYPE_COLORS[entity.type];
  const label = ENTITY_TYPE_LABELS[entity.type];
  const statusColor = STATUS_COLORS[entity.status] || 'var(--text-muted)';
  const critical = needsCriticalAccent(entity.agent_instructions);
  const instructionBorder = critical ? 'var(--accent-red)' : color;

  const outgoing = entity.outgoing || [];
  const incoming = entity.incoming || [];
  const entityDeliverables = deliverables
    .filter(d => d.project === entity.slug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, width: 480, maxWidth: '100%', height: '100vh', zIndex: 2000,
      background: 'rgba(8,10,14,0.98)', borderLeft: '1px solid rgba(255,0,255,0.2)', padding: 20, overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: 16, cursor: 'pointer' }}>← Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => onEdit(entity)} style={{ background: 'transparent', border: `1px solid ${color}`, color, padding: '6px 10px', cursor: 'pointer' }}>Edit</button>
          <button onClick={() => onDelete(entity)} style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '6px 10px', cursor: 'pointer' }}>Delete</button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{
          fontSize: 12,
          fontFamily: 'var(--font-heading)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color,
          border: `1px solid ${color}`,
          padding: '4px 8px',
        }}>{label}</span>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
        <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{entity.status}</span>
      </div>

      <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, margin: '6px 0' }}>{entity.icon ? `${entity.icon} ` : ''}{entity.name}</h2>
      {entity.full_name && entity.full_name !== entity.name && (
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>{entity.full_name}</div>
      )}

      {entity.description && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Description</div>
          <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{entity.description}</div>
        </section>
      )}

      <section style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: instructionBorder, marginBottom: 6 }}>⚡ Agent Guardrails</div>
        <div style={{ borderLeft: `4px solid ${instructionBorder}`, background: 'rgba(255,0,255,0.08)', padding: '12px' }}>
          <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{entity.agent_instructions}</div>
        </div>
      </section>

      <section style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Key People</div>
        {entity.key_people?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entity.key_people.map((p, i) => (
              <div key={i} style={{ fontSize: 16 }}>
                <strong>{p.name}</strong> — {p.role}
                {p.notes && <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{p.notes}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>None listed.</div>
        )}
      </section>

      <section style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Tracking Focus</div>
        {entity.tracking_focus?.length ? (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {entity.tracking_focus.map((f, i) => (
              <li key={i} style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{f}</li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>None listed.</div>
        )}
      </section>

      {entity.financial_notes && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>Financial Notes</div>
          <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>{entity.financial_notes}</div>
        </section>
      )}

      {entityDeliverables.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Deliverables</div>
            <Link href={`/output?project=${entity.slug}`} style={{ color: 'var(--accent-cyan)', fontSize: 12, textDecoration: 'none' }}>
              View all →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {entityDeliverables.slice(0, 5).map(deliverable => (
              <DeliverableCard key={deliverable.id} deliverable={deliverable} compact />
            ))}
          </div>
        </section>
      )}

      <section style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Relationships</div>
          <button onClick={onAddRelationship} style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>+ Add Relationship</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {outgoing.map(rel => (
            <div key={rel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <div style={{ fontSize: 15 }}>
                → {RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type}{' '}
                {rel.target && (
                  <button onClick={() => onSelectEntity(rel.target!.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                    {rel.target.name}
                  </button>
                )}
                {rel.description && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{rel.description}</div>}
              </div>
              <button onClick={() => onRemoveRelationship(rel)} style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '2px 6px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
            </div>
          ))}
          {incoming.map(rel => (
            <div key={rel.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6 }}>
              <div style={{ fontSize: 15 }}>
                ← {RELATIONSHIP_LABELS[rel.relationship_type] || rel.relationship_type}{' '}
                {rel.source && (
                  <button onClick={() => onSelectEntity(rel.source!.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                    {rel.source.name}
                  </button>
                )}
                {rel.description && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{rel.description}</div>}
              </div>
              <button onClick={() => onRemoveRelationship(rel)} style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '2px 6px', cursor: 'pointer', fontSize: 12 }}>Remove</button>
            </div>
          ))}
          {outgoing.length === 0 && incoming.length === 0 && (
            <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>No relationships yet.</div>
          )}
        </div>
      </section>

      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        Created: {new Date(entity.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {' · '}Updated: {new Date(entity.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </div>
    </div>
  );
}
