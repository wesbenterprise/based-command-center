import { useEffect, useState, type CSSProperties } from 'react';
import { Entity, EntityType, KeyPerson } from '../../types/entities';
import { ENTITY_TYPE_LABELS, ENTITY_TYPE_COLORS, slugify } from './entityStyles';

interface EntityFormProps {
  entity?: Entity | null;
  onCancel: () => void;
  onSave: (payload: Partial<Entity>) => void;
}

const ENTITY_TYPES: EntityType[] = [
  'person',
  'family_office',
  'operating_company',
  'investment_vehicle',
  'venture_fund',
  'nonprofit',
  'real_estate',
  'public_company',
  'philanthropic',
];

export default function EntityForm({ entity, onCancel, onSave }: EntityFormProps) {
  const [name, setName] = useState(entity?.name || '');
  const [fullName, setFullName] = useState(entity?.full_name || '');
  const [slug, setSlug] = useState(entity?.slug || '');
  const [type, setType] = useState<EntityType>(entity?.type || 'person');
  const [description, setDescription] = useState(entity?.description || '');
  const [agentInstructions, setAgentInstructions] = useState(entity?.agent_instructions || '');
  const [financialNotes, setFinancialNotes] = useState(entity?.financial_notes || '');
  const [trackingFocus, setTrackingFocus] = useState((entity?.tracking_focus || []).join('\n'));
  const [keyPeople, setKeyPeople] = useState<KeyPerson[]>(entity?.key_people || []);
  const [status, setStatus] = useState<'active' | 'watch' | 'inactive'>(entity?.status || 'active');
  const [icon, setIcon] = useState(entity?.icon || '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entity) {
      setSlug(slugify(name));
    }
  }, [name, entity]);

  const addPerson = () => {
    setKeyPeople(prev => [...prev, { name: '', role: '', notes: '' }]);
  };

  const updatePerson = (index: number, patch: Partial<KeyPerson>) => {
    setKeyPeople(prev => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  };

  const removePerson = (index: number) => {
    setKeyPeople(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) return setError('Name is required.');
    if (!slug.trim()) return setError('Slug is required.');
    if (!type) return setError('Type is required.');
    if (!agentInstructions.trim()) return setError('Agent instructions are required.');

    const payload: Partial<Entity> = {
      name: name.trim(),
      full_name: fullName.trim() || null,
      slug: slugify(slug.trim()),
      type,
      description: description.trim() || null,
      agent_instructions: agentInstructions.trim(),
      financial_notes: financialNotes.trim() || null,
      tracking_focus: trackingFocus.split('\n').map(t => t.trim()).filter(Boolean),
      key_people: keyPeople.filter(p => p.name.trim() && p.role.trim()),
      status,
      icon: icon.trim() || null,
    };

    setError(null);
    onSave(payload);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2200, background: 'rgba(4,5,8,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div className="panel" style={{ width: 'min(820px, 95vw)', maxHeight: '90vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{entity ? 'Edit Entity' : 'Create Entity'}</h2>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {error && <div style={{ color: 'var(--accent-red)', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          <label>
            <div style={{ marginBottom: 4 }}>Name *</div>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Full Name</div>
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Slug *</div>
            <input value={slug} onChange={e => setSlug(e.target.value)} style={inputStyle} />
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Type *</div>
            <select value={type} onChange={e => setType(e.target.value as EntityType)} style={inputStyle}>
              {ENTITY_TYPES.map(t => (
                <option key={t} value={t}>{ENTITY_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label>
            <div style={{ marginBottom: 4 }}>Icon (optional)</div>
            <input value={icon} onChange={e => setIcon(e.target.value)} style={inputStyle} placeholder="🏢" />
          </label>
        </div>

        <label style={{ display: 'block', marginTop: 12 }}>
          <div style={{ marginBottom: 4 }}>Description</div>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={textareaStyle} />
        </label>

        <label style={{ display: 'block', marginTop: 12 }}>
          <div style={{ marginBottom: 4, color: 'var(--accent-magenta)' }}>⚡ Agent Instructions *</div>
          <textarea value={agentInstructions} onChange={e => setAgentInstructions(e.target.value)} rows={4} style={{ ...textareaStyle, borderColor: 'var(--accent-magenta)' }} />
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>These guardrails control how agents interact with this entity.</div>
        </label>

        <label style={{ display: 'block', marginTop: 12 }}>
          <div style={{ marginBottom: 4 }}>Financial Notes</div>
          <textarea value={financialNotes} onChange={e => setFinancialNotes(e.target.value)} rows={2} style={textareaStyle} />
        </label>

        <label style={{ display: 'block', marginTop: 12 }}>
          <div style={{ marginBottom: 4 }}>Tracking Focus (one per line)</div>
          <textarea value={trackingFocus} onChange={e => setTrackingFocus(e.target.value)} rows={3} style={textareaStyle} />
        </label>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>Key People</div>
          {keyPeople.map((person, index) => (
            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
              <input value={person.name} onChange={e => updatePerson(index, { name: e.target.value })} placeholder="Name" style={inputStyle} />
              <input value={person.role} onChange={e => updatePerson(index, { role: e.target.value })} placeholder="Role" style={inputStyle} />
              <input value={person.notes || ''} onChange={e => updatePerson(index, { notes: e.target.value })} placeholder="Notes" style={inputStyle} />
              <button onClick={() => removePerson(index)} style={{ background: 'transparent', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', cursor: 'pointer' }}>✕</button>
            </div>
          ))}
          <button onClick={addPerson} style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '6px 10px', cursor: 'pointer' }}>+ Add Person</button>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 6 }}>Status</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {(['active', 'watch', 'inactive'] as const).map(s => (
              <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, color: s === 'active' ? 'var(--accent-green)' : s === 'watch' ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                <input type="radio" checked={status === s} onChange={() => setStatus(s)} /> {s}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
          <button onClick={onCancel} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '8px 14px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ background: 'transparent', border: `1px solid ${ENTITY_TYPE_COLORS[type]}`, color: ENTITY_TYPE_COLORS[type], padding: '8px 14px', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>
            Save Entity
          </button>
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

const textareaStyle: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  resize: 'vertical',
};
