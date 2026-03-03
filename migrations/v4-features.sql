CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'task_completed', 'task_started', 'dispatch_sent', 'dispatch_received',
        'flag', 'error', 'message', 'deploy', 'decision', 'review'
    )),
    description TEXT NOT NULL,
    linked_agent_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_agent ON activity_feed(agent_id);

INSERT INTO activity_feed (agent_id, agent_name, activity_type, description, created_at) VALUES
('dezayas', 'Dezayas', 'deploy', 'Deployed Command Center v3', now() - interval '2 hours'),
('astra', 'Astra', 'task_completed', 'Architecture spec v3 finalized', now() - interval '3 hours'),
('cid', 'Cid', 'task_completed', 'Gamification spec delivered', now() - interval '3 hours 30 minutes'),
('romero', 'Romero', 'task_completed', 'Logo synthwave variants generated', now() - interval '4 hours'),
('ace', 'Ace', 'message', 'Build brief compiled', now() - interval '5 hours'),
('anderson', 'Anderson', 'task_completed', 'Standing orders migrated', now() - interval '6 hours');
