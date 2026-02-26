import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Entity, EntityType, RelationshipEdge } from '../../types/entities';
import EntityGrid from './EntityGrid';
import EntityDetail from './EntityDetail';
import EntityForm from './EntityForm';
import RelationshipForm from './RelationshipForm';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS } from './entityStyles';

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

  const [navSelection, setNavSelection] = useState<
    | { kind: 'type'; type: EntityType | 'all' }
    | { kind: 'entity'; id: string }
  >({ kind: 'type', type: 'all' });
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
    const searchLower = search.toLowerCase();
    return entities.filter(entity => {
      const matchesType =
        navSelection.kind !== 'type'
          ? true
          : navSelection.type === 'all'
          ? true
          : entity.type === navSelection.type;
      const matchesStatus = statusFilter === 'all' || entity.status === statusFilter;
      const haystack = `${entity.name} ${entity.full_name || ''} ${entity.description || ''} ${entity.agent_instructions || ''}`.toLowerCase();
      const matchesSearch = !searchLower || haystack.includes(searchLower);
      return matchesType && matchesStatus && matchesSearch;
    });
  }, [entities, navSelection, statusFilter, search]);

  const typeCounts = useMemo(() => {
    return TYPE_LIST.reduce<Record<string, number>>((acc, type) => {
      acc[type] = entities.filter(entity => entity.type === type).length;
      return acc;
    }, {});
  }, [entities]);

  const openCreate = () => {
    setFormEntity(null);
    setShowForm(true);
  };

  const openEdit = (entity: Entity) => {
    setFormEntity(entity);
    setShowForm(true);
  };

  const sortedEntities = useMemo(() => {
    return [...entities].sort((a, b) => a.name.localeCompare(b.name));
  }, [entities]);

  const handleSelectType = (type: EntityType | 'all') => {
    setNavSelection({ kind: 'type', type });
    setSelectedEntity(null);
  };

  const handleSelectEntity = (entity: Entity) => {
    setSelectedEntity(entity);
    setNavSelection({ kind: 'entity', id: entity.id });
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
    setNavSelection({ kind: 'type', type: 'all' });
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

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>
        <div className="panel" style={{ padding: 12, position: 'sticky', top: 92 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>
            ENTITY TYPES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {([
              { id: 'all', label: 'ALL ENTITIES' },
              ...TYPE_LIST.map(type => ({ id: type, label: ENTITY_TYPE_LABELS[type], color: ENTITY_TYPE_COLORS[type] })),
            ] as Array<{ id: EntityType | 'all'; label: string; color?: string }>).map(item => {
              const active = navSelection.kind === 'type' && navSelection.type === item.id;
              const count = item.id === 'all' ? entities.length : typeCounts[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectType(item.id)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: `1px solid ${active ? (item.color || 'var(--accent-cyan)') : 'var(--border-subtle)'}`,
                    color: active ? (item.color || 'var(--accent-cyan)') : 'var(--text-muted)',
                    padding: '6px 10px',
                    fontSize: 12,
                    letterSpacing: '0.08em',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{count}</span>
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 12, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 8 }}>
            ENTITIES
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 'calc(100vh - 360px)', overflowY: 'auto', paddingRight: 4 }}>
            {sortedEntities.map(entity => {
              const active = navSelection.kind === 'entity' && navSelection.id === entity.id;
              return (
                <button
                  key={entity.id}
                  onClick={() => handleSelectEntity(entity)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: active ? 'rgba(0,255,255,0.08)' : 'transparent',
                    border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                    color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <span style={{ textAlign: 'left' }}>{entity.name}</span>
                  <span style={{ fontSize: 11, color: ENTITY_TYPE_COLORS[entity.type] }}>{ENTITY_TYPE_LABELS[entity.type]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="panel" style={{ height: 220, opacity: 0.6 }} />
              ))}
            </div>
          ) : navSelection.kind === 'entity' && selectedEntityFull ? (
            <EntityDetail
              entity={selectedEntityFull}
              onClose={() => handleSelectType('all')}
              onEdit={openEdit}
              onDelete={handleDelete}
              onSelectEntity={(entityId) => {
                const target = entities.find(e => e.id === entityId);
                if (target) handleSelectEntity(target);
              }}
              onAddRelationship={() => setShowRelationshipForm(true)}
              onRemoveRelationship={handleRemoveRelationship}
            />
          ) : (
            <EntityGrid
              entities={filteredEntities}
              selectedTypes={[]}
              onToggleType={() => null}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              search={search}
              onSearchChange={setSearch}
              view={view}
              onViewChange={setView}
              onSelect={handleSelectEntity}
              onEdit={openEdit}
              showTypeFilters={false}
            />
          )}
        </div>
      </div>

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
