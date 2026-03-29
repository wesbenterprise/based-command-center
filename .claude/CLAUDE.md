# BASeD Command Center — CLAUDE.md

## What This Is
Internal command center dashboard for Barnett Automated Services & Development (BASeD). Agent roster, deliverables feed, team activity. Internal only — noindex.

## Stack
- Next.js App Router + TypeScript
- Supabase — `@supabase/supabase-js`
- Anthropic Claude SDK — `@anthropic-ai/sdk`
- Octokit (GitHub API) — `@octokit/rest`
- Playwright (testing)
- Vercel deploy — push to main = live

## Key Structure
- `src/app/` — Next.js App Router pages
- `src/components/` — shared UI components
- `src/lib/` — Supabase, GitHub, Claude integrations
- `src/data/` — static data (agent registry, etc.)
- `src/types/` — TypeScript type definitions
- `apps.config.ts` — app/agent configuration
- `migrations/` — Supabase migrations
- `supabase/` — schema and local config

## Hard Rules
- Push directly to `main`
- Navigation: left sidebar (NOT top tabs) — codified 2026-03-08, never revert
- Agent roster and roles are canonical — match AGENTS.md in ace workspace
- Barnett dark/neon aesthetic — this is an internal tool, not a public-facing site
- Never expose API keys or bot tokens in client-side code

## Git Workflow
- Push directly to `main`
- Playwright tests in `test-results/` — run before major changes

## Gotchas
- `apps.config.ts` is the source of truth for agent config in this app
- Octokit integration pulls GitHub activity — needs GITHUB_TOKEN in env
- Anthropic SDK used for AI features — needs ANTHROPIC_API_KEY in env
