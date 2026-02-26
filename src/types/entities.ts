export type EntityType =
  | 'person'
  | 'family_office'
  | 'operating_company'
  | 'investment_vehicle'
  | 'venture_fund'
  | 'nonprofit'
  | 'real_estate'
  | 'public_company'
  | 'philanthropic';

export type RelationshipType =
  | 'parent_of'
  | 'subsidiary_of'
  | 'holds_position_in'
  | 'operates'
  | 'board_member_of'
  | 'affiliated_with'
  | 'stakeholder_in'
  | 'philanthropic_to';

export interface KeyPerson {
  name: string;
  role: string;
  notes?: string;
}

export interface RelationshipEdge {
  id: string;
  relationship_type: RelationshipType;
  description?: string | null;
  source?: { id: string; slug: string; name: string; type: EntityType } | null;
  target?: { id: string; slug: string; name: string; type: EntityType } | null;
}

export interface Entity {
  id: string;
  slug: string;
  name: string;
  full_name?: string | null;
  type: EntityType;
  description?: string | null;
  key_people: KeyPerson[];
  agent_instructions: string;
  financial_notes?: string | null;
  tracking_focus: string[];
  status: 'active' | 'inactive' | 'watch';
  icon?: string | null;
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  outgoing?: RelationshipEdge[];
  incoming?: RelationshipEdge[];
}
