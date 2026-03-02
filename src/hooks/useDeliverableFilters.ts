'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Deliverable, DeliverableFilters, DeliverableStatus, DeliverableType, TimeRange } from '../data/deliverables';

const DEFAULT_TIME_RANGE: TimeRange = '3d';

const parseFilters = (params: URLSearchParams): DeliverableFilters => {
  const agent = params.get('agent') || undefined;
  const type = (params.get('type') as DeliverableType) || undefined;
  const project = params.get('project') || undefined;
  const search = params.get('search') || undefined;
  const status = (params.get('status') as DeliverableStatus) || undefined;
  const timeRange = (params.get('timeRange') as TimeRange) || DEFAULT_TIME_RANGE;
  return { agent, type, project, search, status, timeRange };
};

const buildQuery = (filters: DeliverableFilters) => {
  const params = new URLSearchParams();
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.type) params.set('type', filters.type);
  if (filters.project) params.set('project', filters.project);
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.timeRange && filters.timeRange !== DEFAULT_TIME_RANGE) params.set('timeRange', filters.timeRange);
  return params.toString();
};

export function useDeliverableFilters(initialFilters?: DeliverableFilters) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const derivedFromUrl = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState<DeliverableFilters>({
    ...initialFilters,
    ...derivedFromUrl,
  });

  useEffect(() => {
    setFilters({
      ...initialFilters,
      ...derivedFromUrl,
    });
  }, [derivedFromUrl, initialFilters]);

  const pushFilters = useCallback((nextFilters: DeliverableFilters) => {
    const query = buildQuery(nextFilters);
    router.push(query ? `/output?${query}` : '/output');
  }, [router]);

  const setAllFilters = useCallback((nextFilters: DeliverableFilters) => {
    setFilters(nextFilters);
    pushFilters(nextFilters);
  }, [pushFilters]);

  const setFilter = useCallback(
    <K extends keyof DeliverableFilters>(key: K, value: DeliverableFilters[K]) => {
      const next = { ...filters, [key]: value || undefined };
      setFilters(next);
      pushFilters(next);
    },
    [filters, pushFilters]
  );

  const clearFilters = useCallback(() => {
    setFilters({ timeRange: DEFAULT_TIME_RANGE });
    router.push('/output');
  }, [router]);

  const applyFilters = useCallback((items: Deliverable[]) => {
    const search = filters.search?.toLowerCase().trim();
    const timeRange = filters.timeRange || DEFAULT_TIME_RANGE;
    const now = Date.now();
    const timeMs: Record<string, number> = { '1d': 86400000, '3d': 259200000, '7d': 604800000, '30d': 2592000000 };
    const cutoff = timeRange === 'all' ? 0 : now - (timeMs[timeRange] || timeMs['3d']);

    return items
      .filter(item => {
        if (cutoff > 0) {
          const itemTime = new Date(item.updatedAt || item.createdAt).getTime();
          if (itemTime < cutoff) return false;
        }
        if (filters.agent && item.agentId !== filters.agent) return false;
        if (filters.type && item.type !== filters.type) return false;
        if (filters.project && item.project !== filters.project) return false;
        if (filters.status && item.status !== filters.status) return false;
        if (search) {
          const haystack = `${item.name} ${item.description}`.toLowerCase();
          if (!haystack.includes(search)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [filters]);

  return { filters, setFilter, setAllFilters, clearFilters, applyFilters };
}
