import { DeliverableStatus, DeliverableType } from './deliverables';

export interface DeliverableTypeConfig {
  label: string;
  icon: string;
  color: string;
}

export const deliverableTypes: Record<DeliverableType, DeliverableTypeConfig> = {
  report: { label: 'Report', icon: '📊', color: 'accent-cyan' },
  presentation: { label: 'Deck', icon: '📑', color: 'accent-magenta' },
  site: { label: 'Site', icon: '🌐', color: 'accent-green' },
  dashboard: { label: 'Dashboard', icon: '📈', color: 'accent-amber' },
  design: { label: 'Design', icon: '🎨', color: 'accent-magenta' },
  document: { label: 'Document', icon: '📝', color: 'text-secondary' },
  tool: { label: 'Tool', icon: '🔧', color: 'accent-cyan' },
  dataset: { label: 'Dataset', icon: '🗃️', color: 'accent-amber' },
};

export const deliverableStatuses: Record<DeliverableStatus, { label: string; color: string }> = {
  live: { label: 'Live', color: 'accent-green' },
  draft: { label: 'Draft', color: 'accent-amber' },
  archived: { label: 'Archived', color: 'text-muted' },
};
