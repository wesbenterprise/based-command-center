import { useState } from 'react';
import { Entity, EntityType } from '../../types/entities';
import { ENTITY_TYPE_COLORS, ENTITY_TYPE_LABELS, STATUS_COLORS, needsCriticalAccent } from './entityStyles';
import type { CSSProperties } from 'react';

interface EntityGridProps {
  entities: Entity[];
  selectedTypes: EntityType[];
  onToggleType: (type: EntityType) => void;
  statusFilter: 'all' | 'active' | 'watch' | 'inactive';
  onStatusChange: (status: 'all' | 'active' | 'watch' | 'inactive') => void;
  search: string;
  onSearchChange: (value: string) => void;
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
  onSelect,
  onEdit,
  showTypeFilters = true,
}: EntityGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

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
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entities.map(entity => {
          const color = ENTITY_TYPE_COLORS[entity.type];
          const label = ENTITY_TYPE_LABELS[entity.type];
          const statusColor = STATUS_COLORS[entity.status] || 'var(--text-muted)';
          const critical = needsCriticalAccent(entity.agent_instructions);
          const instructionBorder = critical ? 'var(--accent-red)' : color;
          const relationshipCount = (entity.outgoing?.length || 0) + (entity.incoming?.length || 0);
          const isExpanded = expandedId === entity.id;
          const instructions = entity.agent_instructions || '';
          const truncatedInstructions = instructions.length > 120 ? `${instructions.slice(0, 120)}…` : instructions;

          return (
            <div
              key={entity.id}
              className="panel"
              style={{
                borderLeft: `3px solid ${color}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Main row - clickable to expand */}
              <div
                onClick={() => toggleExpand(entity.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                }}
              >
                {/* Expand indicator */}
                <span style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  flexShrink: 0,
                  width: 16,
                  textAlign: 'center',
                }}>
                  ▸
                </span>

                {/* Name + full name */}
                <div style={{ minWidth: 180, flex: '1 1 180px' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, color: 'var(--text-primary)' }}>
                    {entity.icon ? `${entity.icon} ` : ''}{entity.name}
                  </div>
                  {entity.full_name && entity.full_name !== entity.name && (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{entity.full_name}</div>
                  )}
                </div>

                {/* Type badge */}
                <span style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color,
                  border: `1px solid ${color}`,
                  padding: '3px 8px',
                  background: 'rgba(255,255,255,0.04)',
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </span>

                {/* Description preview */}
                <div style={{ flex: '2 1 200px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {entity.description
                    ? entity.description.length > 100
                      ? `${entity.description.slice(0, 100)}…`
                      : entity.description
                    : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No description</span>
                  }
                </div>

                {/* Relationships count */}
                <span style={{ fontSize: 13, color: 'var(--accent-cyan)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                  🔗 {relationshipCount}
                </span>

                {/* Status dot + label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: statusColor,
                    boxShadow: `0 0 6px ${statusColor}`,
                  }} />
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: statusColor,
                  }}>
                    {entity.status}
                  </span>
                </div>

                {/* Edit button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(entity);
                  }}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${color}`,
                    color,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontFamily: 'var(--font-heading)',
                    flexShrink: 0,
                  }}
                >
                  Edit ✎
                </button>
              </div>

              {/* Expanded accordion content */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '20px 20px 20px 52px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}>
                  {/* Agent Instructions */}
                  <div style={{
                    borderLeft: `3px solid ${instructionBorder}`,
                    background: 'rgba(255,0,255,0.05)',
                    padding: '12px 14px',
                  }}>
                    <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: instructionBorder, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
                      ⚡ Agent Guardrails
                    </div>
                    <div style={{ fontSize: 14, color: critical ? 'var(--accent-red)' : 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {instructions || 'None'}
                    </div>
                  </div>

                  {/* Description (full) */}
                  {entity.description && (
                    <div>
                      <div style={sectionLabelStyle}>Description</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {entity.description}
                      </div>
                    </div>
                  )}

                  {/* Key People */}
                  {entity.key_people && entity.key_people.length > 0 && (
                    <div>
                      <div style={sectionLabelStyle}>Key People</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {entity.key_people.map((person, idx) => (
                          <div key={idx} style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>{person.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}> — {person.role}</span>
                            {person.notes && <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}> ({person.notes})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tracking Focus */}
                  {entity.tracking_focus && entity.tracking_focus.length > 0 && (
                    <div>
                      <div style={sectionLabelStyle}>Tracking Focus</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {entity.tracking_focus.map((item, idx) => (
                          <span key={idx} style={{
                            fontSize: 12,
                            padding: '3px 8px',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            background: 'rgba(255,255,255,0.04)',
                          }}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Financial Notes */}
                  {entity.financial_notes && (
                    <div>
                      <div style={sectionLabelStyle}>Financial Notes</div>
                      <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {entity.financial_notes}
                      </div>
                    </div>
                  )}

                  {/* Relationships summary */}
                  {relationshipCount > 0 && (
                    <div>
                      <div style={sectionLabelStyle}>Relationships ({relationshipCount})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {entity.outgoing?.map(rel => (
                          <div key={rel.id} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{rel.relationship_type.replace(/_/g, ' ')} → </span>
                            <span style={{ color: 'var(--accent-cyan)' }}>{rel.target?.name}</span>
                          </div>
                        ))}
                        {entity.incoming?.map(rel => (
                          <div key={rel.id} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                            <span style={{ color: 'var(--accent-cyan)' }}>{rel.source?.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}> → {rel.relationship_type.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View full detail link */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => onSelect(entity)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--accent-cyan)',
                        color: 'var(--accent-cyan)',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontFamily: 'var(--font-heading)',
                        letterSpacing: '0.06em',
                      }}
                    >
                      Open Full Detail →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {entities.length === 0 && (
          <div className="panel" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            No entities match the current filters.
          </div>
        )}
      </div>
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

const sectionLabelStyle: CSSProperties = {
  fontSize: 11,
  fontFamily: 'var(--font-heading)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 6,
};
