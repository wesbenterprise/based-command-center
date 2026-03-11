CREATE TABLE IF NOT EXISTS agenda_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'today', 'waiting', 'done')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'blocked', 'waiting', 'done')),
  blocked_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sort_order INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_agenda_tasks_priority ON agenda_tasks (priority);
CREATE INDEX IF NOT EXISTS idx_agenda_tasks_status ON agenda_tasks (status);

ALTER TABLE agenda_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service key full access" ON agenda_tasks FOR ALL USING (true) WITH CHECK (true);
