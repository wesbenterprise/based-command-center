import { EntityType } from '../../types/entities';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  person: 'PERSON',
  family_office: 'FAMILY OFFICE',
  operating_company: 'OPERATING CO',
  investment_vehicle: 'INVESTMENT',
  venture_fund: 'VENTURE FUND',
  nonprofit: 'NONPROFIT',
  real_estate: 'REAL ESTATE',
  public_company: 'PUBLIC CO',
  philanthropic: 'PHILANTHROPIC',
};

export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  person: 'var(--accent-cyan)',
  family_office: 'var(--accent-magenta)',
  operating_company: 'var(--accent-amber)',
  investment_vehicle: '#3b82f6',
  venture_fund: '#a855f7',
  nonprofit: 'var(--accent-green)',
  real_estate: '#f97316',
  public_company: '#14b8a6',
  philanthropic: '#ec4899',
};

export const RELATIONSHIP_LABELS: Record<string, string> = {
  parent_of: 'is parent of',
  subsidiary_of: 'is subsidiary of',
  holds_position_in: 'holds position in',
  operates: 'operates',
  board_member_of: 'is board member of',
  affiliated_with: 'is affiliated with',
  stakeholder_in: 'is stakeholder in',
  philanthropic_to: 'philanthropic engagement with',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'var(--accent-green)',
  watch: 'var(--accent-amber)',
  inactive: 'var(--accent-red)',
};

export const needsCriticalAccent = (text: string) => /\bCRITICAL\b|\bDO NOT\b/i.test(text || '');

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
