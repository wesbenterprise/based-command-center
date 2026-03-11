-- prompt_runs: each execution of a prompt against 1-3 models
CREATE TABLE prompt_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  selected_models JSONB NOT NULL, -- e.g. ["claude-sonnet-4-20250514", "grok-3"]
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'complete', 'error')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- prompt_responses: one row per model per run
CREATE TABLE prompt_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES prompt_runs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,        -- 'anthropic', 'openai', 'google', 'xai', 'ollama'
  model_name TEXT NOT NULL,      -- e.g. 'claude-sonnet-4-20250514'
  model_display_name TEXT NOT NULL, -- e.g. 'Claude Sonnet'
  response_text TEXT,
  latency_ms INTEGER,
  token_count_in INTEGER,
  token_count_out INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- saved_prompts: favorites library
CREATE TABLE saved_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  tags JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- index for fast history lookups
CREATE INDEX idx_prompt_runs_created_at ON prompt_runs(created_at DESC);
CREATE INDEX idx_prompt_responses_run_id ON prompt_responses(run_id);
CREATE INDEX idx_saved_prompts_updated_at ON saved_prompts(updated_at DESC);

-- view: rolling average latency per model (for progress bar estimates)
CREATE VIEW model_latency_averages AS
SELECT
  model_name,
  model_display_name,
  provider,
  ROUND(AVG(latency_ms)) AS avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY latency_ms)) AS p90_latency_ms,
  COUNT(*) AS sample_count
FROM prompt_responses
WHERE latency_ms IS NOT NULL AND error IS NULL
GROUP BY model_name, model_display_name, provider;
