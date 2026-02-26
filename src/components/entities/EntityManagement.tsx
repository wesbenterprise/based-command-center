import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Entity, EntityType, RelationshipEdge } from '../../types/entities';
import EntityGrid from './EntityGrid';
import EntityDetail from './EntityDetail';
import EntityForm from './EntityForm';
import RelationshipForm from './RelationshipForm';

const TYPE_LIST: EntityType[] = [
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

export default function EntityManagement() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<EntityType[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'watch' | 'inactive'>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [formEntity, setFormEntity] = useState<Entity | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);

  const fetchEntities = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('entities')
      .select(`
        *,
        outgoing:entity_relationships!source_entity_id(
          id, relationship_type, description,
          target:entities!target_entity_id(id, slug, name, type)
        ),
        incoming:entity_relationships!target_entity_id(
          id, relationship_type, description,
          source:entities!source_entity_id(id, slug, name, type)
        )
      `)
      .order('sort_order')
      .order('name');

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    const normalized = (data || []).map((row: any) => ({
      ...row,
      key_people: Array.isArray(row.key_people)
        ? row.key_people
        : row.key_people
        ? JSON.parse(row.key_people)
        : [],
      tracking_focus: Array.isArray(row.tracking_focus) ? row.tracking_focus : [],
      metadata: row.metadata || {},
    }));

    setEntities(normalized as Entity[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchEntities();
  }, []);

  const filteredEntities = useMemo(() => {
    const activeTypes = selectedTypes.length === 0 ? TYPE_LIST : selectedTypes;
    const searchLower = search.toLowerCase();
    return entities.filter(entity => {
      const matchesType = activeTypes.includes(entity.type);
      const matchesStatus = statusFilter === 'all' || entity.status === statusFilter;
      const haystack = `${entity.name} ${entity.full_name || ''} ${entity.description || ''} ${entity.agent_instructions || ''}`.toLowerCase();
      const matchesSearch = !searchLower || haystack.includes(searchLower);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [entities, selectedTypes, statusFilter, search]);

  const toggleType = (type: EntityType) => {
    setSelectedTypes(prev => (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]));
  };

  const openCreate = () => {
    setFormEntity(null);
    setShowForm(true);
  };

  const openEdit = (entity: Entity) => {
    setFormEntity(entity);
    setShowForm(true);
  };

  const handleSave = async (payload: Partial<Entity>) => {
    if (formEntity) {
      await supabase.from('entities').update(payload).eq('id', formEntity.id);
    } else {
      await supabase.from('entities').insert(payload);
    }
    setShowForm(false);
    setFormEntity(null);
    await fetchEntities();
  };

  const handleDelete = async (entity: Entity) => {
    const ok = window.confirm(`Delete ${entity.name}? This will remove all relationships involving this entity.`);
    if (!ok) return;
    await supabase.from('entities').delete().eq('id', entity.id);
    setSelectedEntity(null);
    await fetchEntities();
  };

  const handleAddRelationship = async (payload: { relationship_type: any; target_entity_id: string; description?: string }) => {
    if (!selectedEntity) return;
    await supabase.from('entity_relationships').insert({
      source_entity_id: selectedEntity.id,
      target_entity_id: payload.target_entity_id,
      relationship_type: payload.relationship_type,
      description: payload.description || null,
    });
    setShowRelationshipForm(false);
    await fetchEntities();
  };

  const handleRemoveRelationship = async (rel: RelationshipEdge) => {
    await supabase.from('entity_relationships').delete().eq('id', rel.id);
    await fetchEntities();
  };

  const selectedEntityFull = selectedEntity
    ? entities.find(e => e.id === selectedEntity.id) || selectedEntity
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>🏢 Entities</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Barnett Family Partners entity map</div>
        </div>
        <button onClick={openCreate} style={{ background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '8px 12px', cursor: 'pointer', fontFamily: 'var(--font-heading)' }}>+ Add New</button>
      </div>

      {error && <div style={{ color: 'var(--accent-red)' }}>{error}</div>}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="panel" style={{ height: 220, opacity: 0.6 }} />
          ))}
        </div>
      ) : (
        <EntityGrid
          entities={filteredEntities}
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
          onSelect={setSelectedEntity}
          onEdit={openEdit}
        />
      )}

      {selectedEntityFull && (
        <EntityDetail
          entity={selectedEntityFull}
          onClose={() => setSelectedEntity(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onSelectEntity={(entityId) => {
            const target = entities.find(e => e.id === entityId);
            if (target) setSelectedEntity(target);
          }}
          onAddRelationship={() => setShowRelationshipForm(true)}
          onRemoveRelationship={handleRemoveRelationship}
        />
      )}

      {showForm && (
        <EntityForm
          entity={formEntity}
          onCancel={() => { setShowForm(false); setFormEntity(null); }}
          onSave={handleSave}
        />
      )}

      {showRelationshipForm && selectedEntityFull && (
        <RelationshipForm
          source={selectedEntityFull}
          entities={entities}
          onCancel={() => setShowRelationshipForm(false)}
          onSave={handleAddRelationship}
        />
      )}
    </div>
  );
}
