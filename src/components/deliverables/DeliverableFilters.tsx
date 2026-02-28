'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeliverableFilters, DeliverableType } from '@/data/deliverables';
import { deliverableTypes } from '@/data/deliverable-types';

interface DeliverableFiltersProps {
  filters: DeliverableFilters;
  onFilterChange: (filters: DeliverableFilters) => void;
  availableAgents: { id: string; name: string; emoji: string }[];
  availableTypes: DeliverableType[];
  availableProjects: { slug: string; label: string }[];
}

export default function DeliverableFilters({
  filters,
  onFilterChange,
  availableAgents,
  availableTypes,
  availableProjects,
}: DeliverableFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  useEffect(() => {
    setSearchValue(filters.search || '');
  }, [filters.search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchValue !== (filters.search || '')) {
        onFilterChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchValue, filters, onFilterChange]);

  const isActive = Boolean(filters.agent || filters.type || filters.project || filters.search);

  const dot = <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-cyan)', display: 'inline-block', marginLeft: 6 }} />;

  const controlStyle = {
    background: 'rgba(15,18,25,0.9)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-primary)',
    padding: '8px 10px',
    minWidth: 160,
    fontFamily: 'var(--font-heading)',
    fontSize: 14,
  } as const;

  const projectOptions = useMemo(() => {
    return availableProjects.sort((a, b) => a.label.localeCompare(b.label));
  }, [availableProjects]);

  return (
    <div style={{ borderBottom: '1px solid rgba(255,0,255,0.15)', padding: '12px 0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>
          All Agents{filters.agent ? dot : null}
        </span>
        <select
          value={filters.agent || ''}
          onChange={e => onFilterChange({ ...filters, agent: e.target.value || undefined })}
          style={controlStyle}
        >
          <option value="">All Agents</option>
          {availableAgents.map(agent => (
            <option key={agent.id} value={agent.id}>
              {agent.emoji} {agent.name}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>
          All Types{filters.type ? dot : null}
        </span>
        <select
          value={filters.type || ''}
          onChange={e => onFilterChange({ ...filters, type: (e.target.value as DeliverableType) || undefined })}
          style={controlStyle}
        >
          <option value="">All Types</option>
          {availableTypes.map(type => (
            <option key={type} value={type}>
              {deliverableTypes[type].icon} {deliverableTypes[type].label}
            </option>
          ))}
        </select>
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>
          All Projects{filters.project ? dot : null}
        </span>
        <select
          value={filters.project || ''}
          onChange={e => onFilterChange({ ...filters, project: e.target.value || undefined })}
          style={controlStyle}
        >
          <option value="">All Projects</option>
          {projectOptions.map(project => (
            <option key={project.slug} value={project.slug}>
              {project.label}
            </option>
          ))}
        </select>
      </label>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 220 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Search</span>
        <input
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder="Search deliverables..."
          style={{
            ...controlStyle,
            width: '100%',
            fontFamily: 'var(--font-body)',
          }}
        />
      </div>

      {isActive && (
        <button
          onClick={() => onFilterChange({})}
          style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          Clear all
        </button>
      )}
    </div>
  );
}
