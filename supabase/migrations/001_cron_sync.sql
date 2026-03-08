-- Cron jobs state mirror (synced from local gateway)
CREATE TABLE IF NOT EXISTS cron_jobs (
  id TEXT PRIMARY KEY,
  name TEXT,
  cron TEXT,
  human TEXT,
  tz TEXT DEFAULT 'America/New_York',
  message TEXT,
  enabled BOOLEAN DEFAULT true,
  next_run TEXT,
  last_run TEXT,
  channel TEXT,
  target TEXT,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Remote commands queue
CREATE TABLE IF NOT EXISTS cron_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('run', 'enable', 'disable', 'edit')),
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  executed_at TIMESTAMPTZ
);

-- Index for pending commands pickup
CREATE INDEX IF NOT EXISTS idx_cron_commands_pending ON cron_commands(status) WHERE status = 'pending';

-- RLS: allow anon read on cron_jobs, allow anon insert on cron_commands
ALTER TABLE cron_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cron_jobs" ON cron_jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can read cron_commands" ON cron_commands FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cron_commands" ON cron_commands FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update cron_commands" ON cron_commands FOR UPDATE USING (true);
