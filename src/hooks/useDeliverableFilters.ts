'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Deliverable, DeliverableFilters, DeliverableStatus, DeliverableType } from '../data/deliverables';

const parseFilters = (params: URLSearchParams): DeliverableFilters => {
  const agent = params.get('agent') || undefined;
  const type = (params.get('type') as DeliverableType) || undefined;
  const project = params.get('project') || undefined;
  const search = params.get('search') || undefined;
  const status = (params.get('status') as DeliverableStatus) || undefined;
  return { agent, type, project, search, status };
};

const buildQuery = (filters: DeliverableFilters) => {
  const params = new URLSearchParams();
  if (filters.agent) params.set('agent', filters.agent);
  if (filters.type) params.set('type', filters.type);
  if (filters.project) params.set('project', filters.project);
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
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
    setFilters({});
    router.push('/output');
  }, [router]);

  const applyFilters = useCallback((items: Deliverable[]) => {
    const search = filters.search?.toLowerCase().trim();
    return items
      .filter(item => {
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
