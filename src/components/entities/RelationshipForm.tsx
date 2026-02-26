import { useState, type CSSProperties } from 'react';
import { Entity, RelationshipType } from '../../types/entities';
import { RELATIONSHIP_LABELS } from './entityStyles';

interface RelationshipFormProps {
  source: Entity;
  entities: Entity[];
  onCancel: () => void;
  onSave: (payload: { relationship_type: RelationshipType; target_entity_id: string; description?: string }) => void;
}

const RELATIONSHIP_TYPES: RelationshipType[] = [
  'parent_of',
  'subsidiary_of',
  'holds_position_in',
  'operates',
  'board_member_of',
  'affiliated_with',
  'stakeholder_in',
  'philanthropic_to',
];

export default function RelationshipForm({ source, entities, onCancel, onSave }: RelationshipFormProps) {
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('affiliated_with');
  const [targetId, setTargetId] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!targetId) return setError('Select a target entity.');
    setError(null);
    onSave({ relationship_type: relationshipType, target_entity_id: targetId, description: description.trim() || undefined });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2300, background: 'rgba(4,5,8,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="panel" style={{ width: 'min(520px, 92vw)', padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Add Relationship</h3>
        {error && <div style={{ color: 'var(--accent-red)', marginBottom: 12 }}>{error}</div>}

        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ marginBottom: 4 }}>This entity</div>
          <select value={relationshipType} onChange={e => setRelationshipType(e.target.value as RelationshipType)} style={inputStyle}>
            {RELATIONSHIP_TYPES.map(r => (
              <option key={r} value={r}>{RELATIONSHIP_LABELS[r]}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ marginBottom: 4 }}>Target entity</div>
          <select value={targetId} onChange={e => setTargetId(e.target.value)} style={inputStyle}>
            <option value="">Select entity</option>
            {entities.filter(e => e.id !== source.id).map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'block', marginBottom: 10 }}>
          <div style={{ marginBottom: 4 }}>Description (optional)</div>
          <input value={description} onChange={e => setDescription(e.target.value)} style={inputStyle} />
        </label>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 12px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '8px 12px', cursor: 'pointer' }}>Add</button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
};
