-- BASeD Command Center — Database Migration
-- Run this in the BASeD Supabase SQL Editor

-- Entities (Wesley's world map)
-- Drop and recreate for updated schema
DROP TABLE IF EXISTS entity_relationships;
DROP TABLE IF EXISTS entities;

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    type TEXT NOT NULL CHECK (type IN (
        'person', 'family_office', 'operating_company',
        'investment_vehicle', 'venture_fund', 'nonprofit',
        'real_estate', 'public_company', 'philanthropic'
    )),
    description TEXT,
    key_people JSONB DEFAULT '[]',
    agent_instructions TEXT NOT NULL,
    financial_notes TEXT,
    tracking_focus TEXT[],
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'watch')),
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Relationships (many-to-many, directional)
CREATE TABLE entity_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'parent_of',
        'subsidiary_of',
        'holds_position_in',
        'operates',
        'board_member_of',
        'affiliated_with',
        'stakeholder_in',
        'philanthropic_to'
    )),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT no_self_reference CHECK (source_entity_id != target_entity_id),
    CONSTRAINT unique_relationship UNIQUE (source_entity_id, target_entity_id, relationship_type)
);

CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_status ON entities(status);
CREATE INDEX idx_entities_slug ON entities(slug);
CREATE INDEX idx_rel_source ON entity_relationships(source_entity_id);
CREATE INDEX idx_rel_target ON entity_relationships(target_entity_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER entities_updated_at
    BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed: People
INSERT INTO entities (slug, name, full_name, type, description, key_people, agent_instructions, tracking_focus, sort_order) VALUES
('wesley-barnett', 'Wesley Barnett', 'Wesley R. Barnett', 'person',
 'Founder and Executive Chairman of Barnett Family Partners. Founding partner at TampaBay.Ventures. President of Lakeland Hospitality Group.',
 '[{"name": "David Ward", "role": "Executive Director", "notes": "Runs day-to-day operations"},
   {"name": "Chad Corbitt", "role": "Chief Analyst", "notes": "Leads investment analysis and venture ops"}]'::jsonb,
 'This is the principal. All agent activity serves Wesley.',
 ARRAY['All portfolio entities', 'Cross-entity patterns', 'Calendar and commitments'], 0),

('ashley-barnett', 'Ashley Bell Barnett', 'Ashley Bell Barnett', 'person',
 'Board of Governors member.',
 '[]'::jsonb,
 'Track Board of Governors schedule. Do not manage Ashley''s affairs directly — awareness only.',
 ARRAY['Board of Governors schedule'], 1);

-- Seed: Family Office
INSERT INTO entities (slug, name, full_name, type, description, agent_instructions, financial_notes, tracking_focus, sort_order) VALUES
('bfp', 'BFP', 'Barnett Family Partners, LLC', 'family_office',
 'The family office. Parent entity of the Barnett portfolio. When someone says "the company" without context, they mean BFP.',
 'When referencing "the company" without context, assume BFP. Member loan of $501,221.96 at 4.30% AFR.',
 'Member loan: $501,221.96 at 4.30% AFR (Applicable Federal Rate)',
 ARRAY['Entity-wide performance', 'Compliance', 'Tax planning', 'Member distributions'], 0);

-- Seed: Investment & Venture
INSERT INTO entities (slug, name, full_name, type, description, agent_instructions, tracking_focus, sort_order) VALUES
('lvi', 'LVI', 'Lakeland Ventures & Investments, LLC', 'investment_vehicle',
 'Investment holding vehicle. Primary asset is position in TampaBay.Ventures.',
 'CRITICAL: LVI''s primary investment is its TBV position. Do NOT scan real estate listings on its behalf. Do NOT conflate LVI with direct real estate.',
 ARRAY['TBV position value', 'Distribution schedule', 'K-1 documents'], 0),

('tbv', 'TampaBay.Ventures', 'TampaBay.Ventures', 'venture_fund',
 'Early-stage venture fund focused on Florida ecosystem. Active investment vehicle.',
 'Track portfolio company news, fund performance, Florida venture ecosystem. This is the active investment vehicle — LVI is the holding entity above it.',
 ARRAY['Portfolio company news', 'Fund performance metrics', 'FL venture ecosystem', 'Deal flow'], 0);

-- Seed: Operating Company & Real Estate
INSERT INTO entities (slug, name, full_name, type, description, agent_instructions, tracking_focus, sort_order) VALUES
('lhg', 'LHG', 'Lakeland Hospitality Group', 'operating_company',
 'Hotel operating company. Manages SpringHill Suites Lakeland.',
 'Track STR benchmarks, RevPAR vs comp set, Marriott brand standards/PIP requirements.',
 ARRAY['STR benchmarks', 'RevPAR vs comp set', 'Marriott brand standards', 'PIP requirements'], 0),

('springhill-suites', 'SpringHill Suites', 'SpringHill Suites by Marriott Lakeland', 'real_estate',
 'Hotel property in Lakeland, FL. Operated by LHG under Marriott flag.',
 'Track property-level performance (RevPAR, occupancy, ADR), capex needs, PIP compliance.',
 ARRAY['RevPAR', 'Occupancy rate', 'ADR', 'Capex needs', 'PIP compliance'], 0);

-- Seed: Public Company
INSERT INTO entities (slug, name, full_name, type, description, agent_instructions, tracking_focus, sort_order) VALUES
('publix', 'Publix', 'Publix Super Markets, Inc.', 'public_company',
 'Employee-owned supermarket chain. Wesley is a stakeholder, not an operator.',
 'Track PUSH.OTC price, quarterly earnings. Wesley does not manage Publix — monitor as stakeholder, not operator.',
 ARRAY['PUSH.OTC price', 'Quarterly earnings', 'Dividend distributions'], 0);

-- Seed: Philanthropic & Nonprofit
INSERT INTO entities (slug, name, full_name, type, description, agent_instructions, tracking_focus, sort_order) VALUES
('bsp', 'BSP', 'Bonnet Springs Park', 'philanthropic',
 'Public park in Lakeland, FL. Philanthropic legacy project.',
 'Monitor visitor data, community impact metrics. Track as philanthropic legacy — not a business investment.',
 ARRAY['Visitor data', 'Community impact metrics', 'Event calendar'], 0),

('fl-poly', 'FL Poly', 'Florida Polytechnic University', 'nonprofit',
 'University in Lakeland. Home of BARC (Barnett Applied Research Center).',
 'Track BARC research output, grants awarded. Part of family philanthropy impact tracking.',
 ARRAY['BARC research output', 'Grants awarded', 'Board meeting dates'], 0),

('lrh', 'LRH', 'Lakeland Regional Health', 'philanthropic',
 'Regional health system. Family philanthropic engagement.',
 'Track construction progress, campaign milestones. Part of family philanthropy impact tracking.',
 ARRAY['Construction progress', 'Campaign milestones', 'Capital campaign status'], 0),

('cmfl', 'Children''s Movement of FL', 'The Children''s Movement of Florida', 'nonprofit',
 'Advocacy organization for early childhood education and care in Florida.',
 'Track FL early childhood policy, legislative activity. Connects to Carol''s legacy.',
 ARRAY['FL early childhood policy', 'Legislative activity', 'Advocacy campaigns'], 0),

('givewell', 'GiveWell', 'GiveWell Community Foundation', 'nonprofit',
 'Community foundation. Wesley serves on the board.',
 'Track board meeting dates, prep materials, relevant community foundation news.',
 ARRAY['Board meeting dates', 'Prep materials', 'Community foundation news'], 0);

-- Seed: Relationships
INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'parent_of', 'BFP is the parent family office'
FROM entities s, entities t WHERE s.slug = 'bfp' AND t.slug = 'lvi';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'parent_of', 'BFP is the parent family office'
FROM entities s, entities t WHERE s.slug = 'bfp' AND t.slug = 'lhg';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'holds_position_in', 'LVI''s primary investment is its TBV position'
FROM entities s, entities t WHERE s.slug = 'lvi' AND t.slug = 'tbv';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'operates', 'LHG manages the SpringHill Suites property'
FROM entities s, entities t WHERE s.slug = 'lhg' AND t.slug = 'springhill-suites';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'parent_of', 'Wesley is the principal behind BFP'
FROM entities s, entities t WHERE s.slug = 'wesley-barnett' AND t.slug = 'bfp';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'board_member_of', 'Wesley serves on the FL Poly board'
FROM entities s, entities t WHERE s.slug = 'wesley-barnett' AND t.slug = 'fl-poly';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'board_member_of', 'Wesley serves on the GiveWell board'
FROM entities s, entities t WHERE s.slug = 'wesley-barnett' AND t.slug = 'givewell';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'stakeholder_in', 'Publix stakeholder (not operator)'
FROM entities s, entities t WHERE s.slug = 'wesley-barnett' AND t.slug = 'publix';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'philanthropic_to', 'Family philanthropic engagement'
FROM entities s, entities t WHERE s.slug = 'bfp' AND t.slug = 'bsp';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'philanthropic_to', 'Family philanthropic engagement'
FROM entities s, entities t WHERE s.slug = 'bfp' AND t.slug = 'lrh';

INSERT INTO entity_relationships (source_entity_id, target_entity_id, relationship_type, description)
SELECT s.id, t.id, 'philanthropic_to', 'Connected to Carol''s legacy'
FROM entities s, entities t WHERE s.slug = 'bfp' AND t.slug = 'cmfl';

-- Tasks (standing orders)
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    project TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual')),
    active BOOLEAN DEFAULT true,
    urgent BOOLEAN DEFAULT false,
    last_run TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity Log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id TEXT REFERENCES tasks(id),
    goal TEXT,
    strategy TEXT,
    results TEXT,
    learnings TEXT,
    flag BOOLEAN DEFAULT false,
    flag_note TEXT,
    api_cost DECIMAL(10,4) DEFAULT 0,
    status TEXT DEFAULT 'success' CHECK (status IN ('success', 'flagged', 'failed', 'running')),
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Proposals (quest board)
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    rationale TEXT,
    proposed_task JSONB,
    category TEXT DEFAULT 'opportunity' CHECK (category IN ('opportunity', 'alert', 'threat', 'improvement')),
    confidence TEXT DEFAULT 'medium' CHECK (confidence IN ('low', 'medium', 'high')),
    effort TEXT DEFAULT 'medium' CHECK (effort IN ('low', 'medium', 'high')),
    related_entities TEXT[],
    xp_reward INTEGER DEFAULT 30,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    created_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Morning Briefs
CREATE TABLE briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    content TEXT NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT now()
);

-- User State (gamification)
CREATE TABLE user_state (
    id TEXT PRIMARY KEY DEFAULT 'wesley',
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    last_level_shown INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_active_date DATE,
    review_streak INTEGER DEFAULT 0,
    last_review_date DATE,
    sound_enabled BOOLEAN DEFAULT false,
    sound_volume TEXT DEFAULT 'subtle',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Flagged Emails (Priority Inbox)
CREATE TABLE flagged_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmail_id TEXT NOT NULL,
    subject TEXT,
    sender TEXT,
    sender_domain TEXT,
    received_at TIMESTAMPTZ,
    priority TEXT NOT NULL CHECK (priority IN ('red', 'yellow', 'green')),
    agents JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'snoozed', 'expired')),
    snooze_until TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_active_gmail UNIQUE (gmail_id)
);

-- Email Feedback (learning system)
CREATE TABLE email_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmail_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    subject TEXT,
    sender TEXT,
    sender_domain TEXT,
    category TEXT,
    rejection_type TEXT NOT NULL CHECK (rejection_type IN ('wrong_priority', 'not_relevant', 'already_handled', 'never_flag')),
    wesley_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Email Scan Cache
CREATE TABLE email_scan_cache (
    gmail_id TEXT PRIMARY KEY,
    subject TEXT,
    sender TEXT,
    sender_domain TEXT,
    received_at TIMESTAMPTZ,
    labels TEXT[],
    snippet TEXT,
    cached_at TIMESTAMPTZ DEFAULT now()
);

-- Email Access Log (audit trail)
CREATE TABLE email_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gmail_id TEXT NOT NULL,
    agent TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('headers', 'body')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_activity_task ON activity_log(task_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_flagged_status ON flagged_emails(status);
CREATE INDEX idx_flagged_priority ON flagged_emails(priority) WHERE status = 'active';
CREATE INDEX idx_feedback_agent ON email_feedback(agent);
CREATE INDEX idx_feedback_sender ON email_feedback(sender_domain);
CREATE INDEX idx_cache_received ON email_scan_cache(received_at DESC);

-- Seed user state
INSERT INTO user_state (id, total_xp, current_level, current_streak) 
VALUES ('wesley', 0, 1, 1);
