import EntityCard from './EntityCard';
import { Entity, EntityType } from '../../types/entities';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS, needsCriticalAccent } from './entityStyles';
import type { CSSProperties } from 'react';

interface EntityGridProps {
  entities: Entity[];
  selectedTypes: EntityType[];
  onToggleType: (type: EntityType) => void;
  statusFilter: 'all' | 'active' | 'watch' | 'inactive';
  onStatusChange: (status: 'all' | 'active' | 'watch' | 'inactive') => void;
  search: string;
  onSearchChange: (value: string) => void;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  onSelect: (entity: Entity) => void;
  onEdit: (entity: Entity) => void;
  showTypeFilters?: boolean;
}

const TYPES: EntityType[] = [
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

export default function EntityGrid({
  entities,
  selectedTypes,
  onToggleType,
  statusFilter,
  onStatusChange,
  search,
  onSearchChange,
  view,
  onViewChange,
  onSelect,
  onEdit,
  showTypeFilters = true,
}: EntityGridProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="panel" style={{ padding: 16 }}>
        {showTypeFilters && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Filter:</span>
            {TYPES.map(type => {
              const active = selectedTypes.includes(type);
              const color = ENTITY_TYPE_COLORS[type];
              return (
                <button
                  key={type}
                  onClick={() => onToggleType(type)}
                  style={{
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: `1px solid ${active ? color : 'var(--border-subtle)'}`,
                    color: active ? color : 'var(--text-muted)',
                    padding: '4px 8px',
                    fontSize: 12,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                  }}
                >
                  {ENTITY_TYPE_LABELS[type]}
                </button>
              );
            })}
            <button
              onClick={() => TYPES.forEach(t => selectedTypes.includes(t) && onToggleType(t))}
              style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', padding: '4px 8px', fontSize: 12, cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <input
            placeholder="Search name, description, instructions..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: '8px 10px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <select value={statusFilter} onChange={e => onStatusChange(e.target.value as 'all' | 'active' | 'watch' | 'inactive')} style={selectStyle}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="watch">Watch</option>
            <option value="inactive">Inactive</option>
          </select>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onViewChange('grid')} style={view === 'grid' ? activeToggleStyle : toggleStyle}>Grid</button>
            <button onClick={() => onViewChange('list')} style={view === 'list' ? activeToggleStyle : toggleStyle}>List</button>
          </div>
        </div>
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {entities.map(entity => (
            <EntityCard key={entity.id} entity={entity} onSelect={onSelect} onEdit={onEdit} />
          ))}
        </div>
      ) : (
        <div className="panel" style={{ padding: 12, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                <th style={{ padding: '8px 6px' }}>Name</th>
                <th style={{ padding: '8px 6px' }}>Type</th>
                <th style={{ padding: '8px 6px' }}>Agent Instructions</th>
                <th style={{ padding: '8px 6px' }}>Links</th>
                <th style={{ padding: '8px 6px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {entities.map(entity => {
                const critical = needsCriticalAccent(entity.agent_instructions);
                return (
                  <tr key={entity.id} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '8px 6px' }}>
                      <button onClick={() => onSelect(entity)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}>
                        {entity.name}
                      </button>
                    </td>
                    <td style={{ padding: '8px 6px', color: ENTITY_TYPE_COLORS[entity.type] }}>{ENTITY_TYPE_LABELS[entity.type]}</td>
                    <td style={{ padding: '8px 6px', color: critical ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                      {entity.agent_instructions.length > 80 ? `${entity.agent_instructions.slice(0, 80)}…` : entity.agent_instructions}
                    </td>
                    <td style={{ padding: '8px 6px' }}>{(entity.outgoing?.length || 0) + (entity.incoming?.length || 0)}</td>
                    <td style={{ padding: '8px 6px' }}>{entity.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const selectStyle: CSSProperties = {
  padding: '8px 10px',
  background: 'rgba(0,0,0,0.3)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-body)',
};

const toggleStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-muted)',
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: 'var(--font-heading)',
  fontSize: 12,
  textTransform: 'uppercase',
};

const activeToggleStyle: CSSProperties = {
  ...toggleStyle,
  border: '1px solid var(--accent-cyan)',
  color: 'var(--accent-cyan)',
};
