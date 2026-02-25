-- BASeD Command Center — Database Migration
-- Run this in the BASeD Supabase SQL Editor

-- Entities (Wesley's world map)
CREATE TABLE entities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    key_contacts TEXT,
    financial_details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

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
