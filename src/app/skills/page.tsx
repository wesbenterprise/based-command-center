'use client';

import { useState } from 'react';
import Link from 'next/link';
import { agents } from '../../data/agents';

// ─── Skills Data ─────────────────────────────────────────────
// TODO: replace with gateway API call when skills endpoint exists
interface Skill {
  id: string;
  name: string;
  icon: string;
  category: 'coding' | 'communication' | 'data' | 'creative' | 'research' | 'operations';
  description: string;
  fullDescription: string;
  path: string;
  agentIds: string[];
  exampleUsage?: string;
}

const SKILLS: Skill[] = [
  {
    id: 'commit',
    name: 'commit',
    icon: '📝',
    category: 'coding',
    description: 'Create git commits with proper formatting, staged files, and co-author attribution.',
    fullDescription: 'Automates the git commit workflow: checks diff, stages relevant files, drafts a meaningful commit message focusing on the "why", and creates the commit with proper co-author attribution. Never skips hooks or force-pushes.',
    path: '~/.claude/skills/commit.md',
    agentIds: ['dezayas', 'ace'],
    exampleUsage: '/commit',
  },
  {
    id: 'review-pr',
    name: 'review-pr',
    icon: '🔍',
    category: 'coding',
    description: 'Review GitHub pull requests with structured feedback on code quality and correctness.',
    fullDescription: 'Fetches the PR diff and comments, analyzes changes for bugs, security issues, and style violations, then posts a structured review with inline comments and a summary verdict (approve/request changes).',
    path: '~/.claude/skills/review-pr.md',
    agentIds: ['dezayas'],
    exampleUsage: '/review-pr 123',
  },
  {
    id: 'morning-brief',
    name: 'morning-brief',
    icon: '🌅',
    category: 'operations',
    description: 'Generate a structured morning briefing covering priorities, flags, and today\'s agenda.',
    fullDescription: 'Pulls in open flags, standing orders, recent activity, and calendar context to produce a concise morning brief. Formats as a prioritized list: critical decisions, follow-ups, and scheduled items.',
    path: '~/.claude/skills/morning-brief.md',
    agentIds: ['ace'],
    exampleUsage: '/morning-brief',
  },
  {
    id: 'standup',
    name: 'standup',
    icon: '📋',
    category: 'communication',
    description: 'Generate or record daily standup summaries for async team updates.',
    fullDescription: 'Creates structured standup entries: what was done, what\'s next, and any blockers. Stores in Supabase for async consumption. Can also aggregate multiple agents\' standups into a fleet summary.',
    path: '~/.claude/skills/standup.md',
    agentIds: ['ace', 'dezayas', 'astra'],
    exampleUsage: '/standup',
  },
  {
    id: 'research',
    name: 'research',
    icon: '🔬',
    category: 'research',
    description: 'Run a structured research sprint on a topic, producing a formatted intel report.',
    fullDescription: 'Performs multi-source web research, cross-references findings, and synthesizes into a structured report with: executive summary, key findings, sources, and confidence ratings. Stores result to Supabase intel table.',
    path: '~/.claude/skills/research.md',
    agentIds: ['astra', 'atlas', 'charles', 'julius'],
    exampleUsage: '/research "competitor landscape for X"',
  },
  {
    id: 'deploy',
    name: 'deploy',
    icon: '🚀',
    category: 'coding',
    description: 'Run the deployment pipeline with pre-flight checks, build, and health verification.',
    fullDescription: 'Executes the full deploy sequence: lint, test, build, push to remote, trigger CI, and poll for health check. Aborts with a clear error summary if any step fails. Notifies via Telegram on completion.',
    path: '~/.claude/skills/deploy.md',
    agentIds: ['dezayas'],
    exampleUsage: '/deploy production',
  },
  {
    id: 'analyze-data',
    name: 'analyze-data',
    icon: '📊',
    category: 'data',
    description: 'Analyze a dataset from Supabase or CSV and produce a statistical summary with insights.',
    fullDescription: 'Loads data from the specified source, runs descriptive statistics, identifies outliers and trends, and produces a formatted analysis with charts (as ASCII or export) and actionable insights.',
    path: '~/.claude/skills/analyze-data.md',
    agentIds: ['anderson', 'astra'],
    exampleUsage: '/analyze-data supabase:revenue_monthly',
  },
  {
    id: 'draft-comms',
    name: 'draft-comms',
    icon: '📣',
    category: 'communication',
    description: 'Draft external communications, donor updates, or public-facing messages.',
    fullDescription: 'Takes a brief and context, then drafts a polished communication in the specified voice/tone. Produces multiple variants (formal, conversational, concise) for human review before sending.',
    path: '~/.claude/skills/draft-comms.md',
    agentIds: ['pressy', 'ace'],
    exampleUsage: '/draft-comms "quarterly donor update"',
  },
  {
    id: 'scan-threats',
    name: 'scan-threats',
    icon: '🛡️',
    category: 'operations',
    description: 'Run a security posture scan on active systems and surface potential vulnerabilities.',
    fullDescription: 'Checks exposed endpoints, reviews recent auth logs for anomalies, scans for misconfigured permissions, and produces a risk-ranked threat summary with remediation steps.',
    path: '~/.claude/skills/scan-threats.md',
    agentIds: ['oracle'],
    exampleUsage: '/scan-threats',
  },
  {
    id: 'scenario-map',
    name: 'scenario-map',
    icon: '🗺️',
    category: 'data',
    description: 'Build a best/base/worst case scenario map for a strategic decision.',
    fullDescription: 'Takes a decision context and key variables, then constructs a structured scenario map with probability-weighted outcomes, key assumptions for each scenario, and the critical inflection points to watch.',
    path: '~/.claude/skills/scenario-map.md',
    agentIds: ['astra', 'anderson'],
    exampleUsage: '/scenario-map "Q3 revenue targets"',
  },
  {
    id: 'gamify',
    name: 'gamify',
    icon: '🎮',
    category: 'creative',
    description: 'Design a gamification loop for a feature or goal with metrics and reward triggers.',
    fullDescription: 'Analyzes the target behavior, designs a points/streak/badge system, defines the trigger-action-reward loop, and produces a spec with implementation notes and measurable success metrics.',
    path: '~/.claude/skills/gamify.md',
    agentIds: ['cid'],
    exampleUsage: '/gamify "daily user engagement"',
  },
  {
    id: 'art-direction',
    name: 'art-direction',
    icon: '🎨',
    category: 'creative',
    description: 'Generate art direction briefs with style, palette, tone, and reference direction.',
    fullDescription: 'Takes a project context and target audience, then produces three distinct visual direction options (safe/bold/cinematic), each with color palette, typography guidance, reference mood, and sample prompts for image generation.',
    path: '~/.claude/skills/art-direction.md',
    agentIds: ['romero'],
    exampleUsage: '/art-direction "brand refresh for grants platform"',
  },
];

const CATEGORIES = ['all', 'coding', 'communication', 'data', 'creative', 'research', 'operations'] as const;
type Category = typeof CATEGORIES[number];

const categoryIcons: Record<string, string> = {
  all: '🌐',
  coding: '💻',
  communication: '💬',
  data: '📊',
  creative: '🎨',
  research: '🔬',
  operations: '⚙️',
};

function AgentPip({ agentId }: { agentId: string }) {
  const agent = agents.find(a => a.id === agentId);
  if (!agent) return null;
  return (
    <Link href={`/agent/${agentId}`} title={agent.name} style={{ textDecoration: 'none' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26,
        borderRadius: '50%',
        background: 'rgba(255,0,255,0.1)',
        border: '1px solid rgba(255,0,255,0.3)',
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}>
        {agent.emoji}
      </span>
    </Link>
  );
}

export default function SkillsPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = SKILLS.filter(s => {
    const matchCategory = activeCategory === 'all' || s.category === activeCategory;
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontFamily: 'var(--font-heading)', fontSize: 13 }}>
          ← Back to HQ
        </Link>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 28 }}>🧠</span>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: 24, letterSpacing: '0.08em', color: 'var(--accent-magenta)' }}>
              Skills Library
            </h1>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {SKILLS.length} installed skills across {agents.filter(a => a.status !== 'planned').length} active agents
            </div>
          </div>
        </div>
      </div>

      {/* Search + Category Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search skills..."
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 4,
            padding: '8px 14px',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            width: 220,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? 'rgba(255,0,255,0.15)' : 'rgba(0,0,0,0.3)',
                border: activeCategory === cat ? '1px solid var(--accent-magenta)' : '1px solid rgba(255,255,255,0.1)',
                color: activeCategory === cat ? 'var(--accent-magenta)' : 'var(--text-secondary)',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: 12,
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span>{categoryIcons[cat]}</span>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {filtered.map(skill => {
          const isExpanded = expanded === skill.id;
          return (
            <div
              key={skill.id}
              className="panel skill-card"
              style={{
                cursor: 'pointer',
                borderColor: isExpanded ? 'rgba(255,0,255,0.5)' : undefined,
              }}
              onClick={() => setExpanded(isExpanded ? null : skill.id)}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{skill.icon}</span>
                  <div>
                    <div style={{
                      fontFamily: 'monospace',
                      fontSize: 15,
                      fontWeight: 600,
                      color: 'var(--accent-cyan)',
                      letterSpacing: '0.02em',
                    }}>
                      /{skill.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      background: 'rgba(255,0,255,0.1)',
                      border: '1px solid rgba(255,0,255,0.25)',
                      borderRadius: 2,
                      color: 'var(--accent-magenta)',
                      fontFamily: 'var(--font-heading)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      display: 'inline-block',
                      marginTop: 3,
                    }}>
                      {skill.category}
                    </div>
                  </div>
                </div>
                <span style={{
                  color: 'var(--text-muted)',
                  fontSize: 16,
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}>
                  ⌄
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 10px', lineHeight: 1.5 }}>
                {isExpanded ? skill.fullDescription : skill.description}
              </p>

              {/* Expanded detail */}
              {isExpanded && skill.exampleUsage && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', marginBottom: 4 }}>
                    EXAMPLE
                  </div>
                  <code style={{
                    display: 'block',
                    fontFamily: 'monospace',
                    fontSize: 12,
                    background: 'rgba(0,0,0,0.4)',
                    border: '1px solid rgba(0,255,255,0.2)',
                    borderRadius: 4,
                    padding: '6px 10px',
                    color: 'var(--accent-cyan)',
                  }}>
                    {skill.exampleUsage}
                  </code>
                </div>
              )}

              {isExpanded && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em', marginBottom: 4 }}>
                    LOCATION
                  </div>
                  <code style={{
                    fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace',
                  }}>
                    {skill.path}
                  </code>
                </div>
              )}

              {/* Assigned agents */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', marginRight: 4 }}>
                    AGENTS
                  </span>
                  {skill.agentIds.length > 0
                    ? skill.agentIds.map(id => <AgentPip key={id} agentId={id} />)
                    : <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>none assigned</span>
                  }
                </div>
                {isExpanded && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>
                    click to collapse
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 16 }}>No skills match your search</div>
        </div>
      )}
    </main>
  );
}
