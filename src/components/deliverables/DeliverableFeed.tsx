'use client';

import { useEffect, useMemo, useState } from 'react';
import { DeliverableFilters, DeliverableType, deliverables } from '@/data/deliverables';
import { deliverableTypes } from '@/data/deliverable-types';
import { agents } from '@/data/agents';
import { useDeliverableFilters } from '@/hooks/useDeliverableFilters';
import DeliverableCard from './DeliverableCard';
import DeliverableFiltersBar from './DeliverableFilters';

interface DeliverableFeedProps {
  initialFilters?: DeliverableFilters;
}

export default function DeliverableFeed({ initialFilters }: DeliverableFeedProps) {
  const { filters, setAllFilters, applyFilters, clearFilters } = useDeliverableFilters(initialFilters);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 150);
    return () => clearTimeout(t);
  }, [filters]);

  const filtered = useMemo(() => applyFilters(deliverables), [applyFilters]);
  const total = deliverables.length;
  const countLabel = filtered.length === total ? `${total} items` : `${filtered.length} of ${total}`;

  const availableAgents = useMemo(() =>
    agents.map(agent => ({ id: agent.id, name: agent.name, emoji: agent.emoji })),
    []
  );

  const availableTypes = useMemo(() => Object.keys(deliverableTypes) as DeliverableType[], []);

  const availableProjects = useMemo(() => {
    const map = new Map<string, string>();
    deliverables.forEach(item => {
      if (item.project) {
        map.set(item.project, item.projectLabel || item.project);
      }
    });
    return Array.from(map.entries()).map(([slug, label]) => ({ slug, label }));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>Deliverables Feed</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{countLabel}</div>
        </div>
      </div>

      <DeliverableFiltersBar
        filters={filters}
        onFilterChange={(next) => {
          if (!next.agent && !next.type && !next.project && !next.search && !next.status) {
            clearFilters();
            return;
          }
          setAllFilters(next);
        }}
        availableAgents={availableAgents}
        availableTypes={availableTypes}
        availableProjects={availableProjects}
      />

      <div style={{ maxWidth: 800, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, opacity: isFiltering ? 0.3 : 1, transition: 'opacity 0.15s ease' }}>
        {total === 0 ? (
          <div className="panel" style={{ padding: 20 }}>No deliverables yet. The team hasn't registered any output.</div>
        ) : filtered.length === 0 ? (
          <div className="panel" style={{ padding: 20 }}>
            No deliverables match your filters.{' '}
            <button
              onClick={clearFilters}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer' }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          filtered.map((deliverable, index) => (
            <div key={deliverable.id} style={{ animationDelay: `${index * 50}ms` }}>
              <DeliverableCard deliverable={deliverable} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
