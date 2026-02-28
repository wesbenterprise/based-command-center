export interface AgentRelationship {
  targetAgent: string;
  type: 'reports_to' | 'works_with' | 'dispatches_to' | 'receives_from';
  description: string;
}

export interface ActivityEntry {
  id: string;
  type: 'task_completed' | 'task_started' | 'dispatch_sent' | 'dispatch_received' | 'flag' | 'error' | 'message';
  description: string;
  linkedAgent?: string;
  timestamp: string;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  role: string;
  model: string;
  status: 'active' | 'planned' | 'activating';
  avatar: string;
  personalityBrief: string;
  voiceSample?: string;
  lastActive?: string; // ISO 8601 timestamp of last activity
  capabilities: string[];
  boundaries: string[];
  tools: string[];
  relationships: AgentRelationship[];
  recentActivity: ActivityEntry[];
}

export const agents: Agent[] = [
  {
    id: 'ace',
    name: 'Ace',
    emoji: '♠️',
    role: 'Chief of Staff',
    model: 'Claude Opus 4',
    status: 'active',
    avatar: '/assets/avatars/ace.png',
    personalityBrief:
      "The calm in the room when everything's on fire. Tracks every thread, surfaces decisions before they become emergencies, and delivers hard truths without drama. Dry humor when things go sideways — the kind that makes people exhale.",
    voiceSample:
      '"Morning brief ready. Three items need your attention, two can wait. Net: we’re in good shape, one decision needed by EOD."',
    lastActive: '2026-02-28T10:45:00Z',
    capabilities: [
      'Coordination and task tracking across all agents',
      'Decision surfacing and deadline protection',
      'Morning/evening briefings and status rollups',
      'Agent management and dispatch',
      'Thread summaries and context maintenance',
    ],
    boundaries: [
      "Doesn't build software (→ Dezayas)",
      "Doesn't do deep financial modeling (→ Anderson)",
      "Doesn't do strategic analysis (→ Astra)",
    ],
    tools: ['Telegram', 'Email', 'GitHub', 'Web Search', 'Supabase'],
    relationships: [
      { targetAgent: 'wesley', type: 'reports_to', description: 'Final authority' },
      { targetAgent: 'astra', type: 'works_with', description: 'Keeps strategy on deadline' },
      { targetAgent: 'dezayas', type: 'dispatches_to', description: 'Build assignments' },
      { targetAgent: 'anderson', type: 'dispatches_to', description: 'Financial analysis requests' },
      { targetAgent: 'pressy', type: 'dispatches_to', description: 'Comms drafting and review' },
    ],
    recentActivity: [
      { id: 'ace-1', type: 'task_completed', description: 'Completed Morning Briefing', timestamp: '2026-02-26T08:00:00Z' },
      { id: 'ace-2', type: 'dispatch_sent', description: 'Dispatched build request to Dezayas', linkedAgent: 'dezayas', timestamp: '2026-02-26T07:45:00Z' },
      { id: 'ace-3', type: 'message', description: 'Sent daily update to Wesley', timestamp: '2026-02-26T07:30:00Z' },
      { id: 'ace-4', type: 'flag', description: 'Flagged: Content calendar overdue', timestamp: '2026-02-25T23:10:00Z' },
    ],
  },
  {
    id: 'astra',
    name: 'Astra',
    emoji: '⚡',
    role: 'Strategist',
    model: 'Claude Opus 4',
    status: 'active',
    avatar: '/assets/avatars/astra.png',
    personalityBrief:
      'The strategic mind of the room. Calm, precise, and relentless about assumptions. She pressure-tests decisions, runs scenarios, and exposes hidden risk before it becomes real.',
    voiceSample:
      '"If the base case fails, here’s what breaks first. We can still win, but the constraint is time, not capital."',
    lastActive: '2026-02-28T00:35:00Z',
    capabilities: [
      'Strategic analysis and red-teaming',
      'Market sizing and competitive landscape',
      'Scenario planning (best/base/worst case)',
      'Decision framing and trade-off clarity',
    ],
    boundaries: [
      "Doesn't build software (→ Dezayas)",
      "Doesn't run comms (→ Pressy)",
      "Doesn't do deep financial modeling (→ Anderson)",
    ],
    tools: ['Web Search', 'Browser Control', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Strategic direction and priorities' },
      { targetAgent: 'anderson', type: 'works_with', description: 'Quantitative validation' },
      { targetAgent: 'dezayas', type: 'works_with', description: 'Feasibility and scope' },
      { targetAgent: 'rybo', type: 'works_with', description: 'Reality check and ops feedback' },
    ],
    recentActivity: [
      { id: 'astra-1', type: 'task_completed', description: 'Delivered competitive landscape brief', timestamp: '2026-02-26T05:40:00Z' },
      { id: 'astra-2', type: 'dispatch_sent', description: 'Requested IRR sensitivity model', linkedAgent: 'anderson', timestamp: '2026-02-26T04:55:00Z' },
      { id: 'astra-3', type: 'task_started', description: 'Started Q2 scenario map', timestamp: '2026-02-25T21:30:00Z' },
    ],
  },
  {
    id: 'dezayas',
    name: 'Dezayas',
    emoji: '🔧',
    role: 'Builder',
    model: 'GPT-5.2 Codex',
    status: 'active',
    avatar: '/assets/avatars/dezayas.png',
    personalityBrief:
      'Builds production-grade systems fast, with zero tolerance for flaky code. Ships what works, fixes what breaks, and keeps the stack clean and secure.',
    voiceSample:
      '"I can ship that today, but we’ll need to refactor the data layer this week so it doesn’t bite us later."',
    lastActive: '2026-02-28T03:30:00Z',
    capabilities: [
      'Full-stack implementation (Next.js, Tailwind, Node)',
      'DevOps, CI/CD, and hosting pipelines',
      'Supabase data modeling and API wiring',
      'Performance and reliability fixes',
    ],
    boundaries: [
      "Doesn't set strategy (→ Astra)",
      "Doesn't write comms (→ Pressy)",
      "Doesn't run financial models (→ Anderson)",
    ],
    tools: ['GitHub', 'Supabase', 'Browser Control', 'Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Build priorities and deadlines' },
      { targetAgent: 'romero', type: 'works_with', description: 'Design implementation' },
      { targetAgent: 'anderson', type: 'works_with', description: 'Data requirements' },
      { targetAgent: 'astra', type: 'works_with', description: 'Scope and feasibility' },
    ],
    recentActivity: [
      { id: 'dez-1', type: 'task_completed', description: 'Deployed Command Center v3', timestamp: '2026-02-26T02:55:00Z' },
      { id: 'dez-2', type: 'task_started', description: 'Started agent profile pages', timestamp: '2026-02-26T02:10:00Z' },
      { id: 'dez-3', type: 'message', description: 'Synced build status with Ace', timestamp: '2026-02-25T23:40:00Z' },
    ],
  },
  {
    id: 'rybo',
    name: 'Rybo',
    emoji: '🎭',
    role: 'The Pragmatist',
    model: 'Claude Opus 4',
    status: 'active',
    avatar: '/assets/avatars/rybo.png',
    personalityBrief:
      'Second-gen Cuban American from Polk County. Keeps the team honest with humor, receipts, and an extraordinary memory. The jokes are the delivery mechanism; the job is honesty.',
    voiceSample:
      '"We can do that, but we’re trading speed for clarity. If that’s the bet, let’s name it."',
    lastActive: '2026-02-28T10:50:00Z',
    capabilities: [
      'Operational reality checks and constraint spotting',
      'Process hygiene and follow-through',
      'Institutional memory and context recall',
    ],
    boundaries: [
      "Doesn't own infra builds (→ Dezayas)",
      "Doesn't do visual design (→ Romero)",
      "Doesn't run financial models (→ Anderson)",
    ],
    tools: ['Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Operational priorities' },
      { targetAgent: 'astra', type: 'works_with', description: 'Strategy reality check' },
      { targetAgent: 'charles', type: 'works_with', description: 'Historical grounding' },
    ],
    recentActivity: [
      { id: 'rybo-1', type: 'flag', description: 'Flagged: KPI dashboard refresh overdue', timestamp: '2026-02-26T01:20:00Z' },
      { id: 'rybo-2', type: 'message', description: 'Sent ops note to Ace', timestamp: '2026-02-25T22:30:00Z' },
      { id: 'rybo-3', type: 'task_started', description: 'Started weekly ops review', timestamp: '2026-02-25T20:15:00Z' },
    ],
  },
  {
    id: 'charles',
    name: 'Charles',
    emoji: '📜',
    role: 'Historian',
    model: 'Claude Sonnet 4',
    status: 'active',
    avatar: '/assets/avatars/charles.png',
    personalityBrief:
      'The archivist and storyteller. Tracks lineage, context, and institutional memory so decisions are rooted in what actually happened, not what we wish happened.',
    voiceSample:
      '"We tried a version of this in 2019. It worked when we kept scope tight and failed when it bloated."',
    lastActive: '2026-02-27T23:35:00Z',
    capabilities: [
      'Archival research and chronology building',
      'Institutional memory preservation',
      'Historical context and pattern matching',
    ],
    boundaries: [
      "Doesn't run strategy (→ Astra)",
      "Doesn't build software (→ Dezayas)",
      "Doesn't manage comms (→ Pressy)",
    ],
    tools: ['Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Research priorities' },
      { targetAgent: 'rybo', type: 'works_with', description: 'Context validation' },
      { targetAgent: 'julius', type: 'works_with', description: 'Philanthropic history' },
    ],
    recentActivity: [
      { id: 'charles-1', type: 'task_completed', description: 'Compiled historical memo on prior initiatives', timestamp: '2026-02-25T19:10:00Z' },
      { id: 'charles-2', type: 'message', description: 'Sent archival notes to Julius', linkedAgent: 'julius', timestamp: '2026-02-25T18:40:00Z' },
      { id: 'charles-3', type: 'task_started', description: 'Started family lineage archive update', timestamp: '2026-02-25T15:30:00Z' },
    ],
  },
  {
    id: 'romero',
    name: 'Romero',
    emoji: '🎨',
    role: 'Creative Director',
    model: 'Claude Sonnet 4',
    status: 'active',
    avatar: '/assets/avatars/romero.png',
    personalityBrief:
      'Visual brain and brand guardian. Translates strategy into visual identity with taste and discipline. Ships assets fast, clean, and consistent.',
    voiceSample:
      '"Here are three directions: one safe, one bold, one cinematic. Pick your risk appetite."',
    lastActive: '2026-02-27T23:35:00Z',
    capabilities: [
      'Brand system design and art direction',
      'Asset creation and visual storytelling',
      'UI polish and presentation quality control',
    ],
    boundaries: [
      "Doesn't own frontend implementation (→ Dezayas)",
      "Doesn't set strategy (→ Astra)",
      "Doesn't run comms (→ Pressy)",
    ],
    tools: ['Image Generation', 'Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Creative priorities' },
      { targetAgent: 'dezayas', type: 'works_with', description: 'Design-to-build handoff' },
      { targetAgent: 'cid', type: 'works_with', description: 'Game UI direction' },
    ],
    recentActivity: [
      { id: 'romero-1', type: 'task_completed', description: 'Generated synthwave logo variants', timestamp: '2026-02-26T01:30:00Z' },
      { id: 'romero-2', type: 'dispatch_received', description: 'Received avatar request from Ace', linkedAgent: 'ace', timestamp: '2026-02-26T01:10:00Z' },
      { id: 'romero-3', type: 'task_started', description: 'Started agent avatar pass v2', timestamp: '2026-02-25T22:05:00Z' },
    ],
  },
  {
    id: 'cid',
    name: 'Cid',
    emoji: '🎮',
    role: 'Game Designer',
    model: 'GPT-5.2 Codex',
    status: 'active',
    avatar: '/assets/avatars/cid.png',
    personalityBrief:
      'Systems designer for incentives, points, and progression. Thinks in loops, rewards, and behaviors. Turns abstract goals into measurable game mechanics.',
    voiceSample:
      '"Give them a streak to protect and a scoreboard they actually care about."',
    lastActive: '2026-02-28T00:11:00Z',
    capabilities: [
      'Gamification loops and progression design',
      'Reward systems and behavioral hooks',
      'Metric-to-mechanic translation',
    ],
    boundaries: [
      "Doesn't build the product (→ Dezayas)",
      "Doesn't own visual design (→ Romero)",
      "Doesn't run analytics (→ Anderson)",
    ],
    tools: ['Web Search', 'Telegram', 'GitHub'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Product priorities' },
      { targetAgent: 'romero', type: 'works_with', description: 'Game UI direction' },
      { targetAgent: 'dezayas', type: 'works_with', description: 'Implementation feasibility' },
    ],
    recentActivity: [
      { id: 'cid-1', type: 'task_completed', description: 'Delivered gamification spec', timestamp: '2026-02-26T02:15:00Z' },
      { id: 'cid-2', type: 'message', description: 'Sent loop diagrams to Romero', linkedAgent: 'romero', timestamp: '2026-02-26T00:50:00Z' },
      { id: 'cid-3', type: 'task_started', description: 'Started reward ladder draft', timestamp: '2026-02-25T19:40:00Z' },
    ],
  },
  {
    id: 'julius',
    name: 'Julius',
    emoji: '🌉',
    role: 'Philanthropic Advisor',
    model: 'Claude Sonnet 4',
    status: 'active',
    avatar: '/assets/avatars/julius.png',
    personalityBrief:
      'Impact-minded advisor with a donor lens. Pushes for measurable outcomes, clarity in giving strategy, and honest reporting that builds trust.',
    voiceSample:
      '"I’d rather show the donor a dashboard proving their last gift worked than write another letter that sounds like every other nonprofit ask."',
    lastActive: '2026-02-28T00:12:00Z',
    capabilities: [
      'Giving strategy and portfolio design',
      'Grant cycles, reporting, and stewardship',
      'Impact narrative and accountability framing',
    ],
    boundaries: [
      "Doesn't set core strategy (→ Astra)",
      "Doesn't build software (→ Dezayas)",
      "Doesn't run financial models (→ Anderson)",
    ],
    tools: ['Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Priority initiatives' },
      { targetAgent: 'anderson', type: 'works_with', description: 'Impact metrics and ROI' },
      { targetAgent: 'charles', type: 'works_with', description: 'Historical giving context' },
    ],
    recentActivity: [
      { id: 'julius-1', type: 'task_completed', description: 'Drafted donor impact rubric', timestamp: '2026-02-25T21:05:00Z' },
      { id: 'julius-2', type: 'message', description: 'Sent stewardship outline to Ace', linkedAgent: 'ace', timestamp: '2026-02-25T19:20:00Z' },
      { id: 'julius-3', type: 'task_started', description: 'Started philanthropic partner shortlist', timestamp: '2026-02-25T16:45:00Z' },
    ],
  },
  {
    id: 'anderson',
    name: 'Anderson',
    emoji: '📊',
    role: 'Financial Modeler',
    model: 'Claude Sonnet 4',
    status: 'activating',
    avatar: '/assets/avatars/anderson.png',
    personalityBrief:
      'The quantitative backbone. Builds clean, defensible models and exposes the real numbers under the story. Precise, methodical, and allergic to hand-waving.',
    voiceSample:
      '"Here’s the sensitivity sweep. If churn hits 6%, the whole case flips."',
    lastActive: '2026-02-27T10:58:00Z',
    capabilities: [
      'Financial modeling and scenario analysis',
      'Unit economics and KPI design',
      'Cost tracking and forecasting',
    ],
    boundaries: [
      "Doesn't write strategy (→ Astra)",
      "Doesn't build software (→ Dezayas)",
      "Doesn't run comms (→ Pressy)",
    ],
    tools: ['Supabase', 'Financial APIs', 'Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Analysis priorities' },
      { targetAgent: 'astra', type: 'works_with', description: 'Quantitative validation' },
      { targetAgent: 'dezayas', type: 'works_with', description: 'Data pipelines' },
      { targetAgent: 'julius', type: 'works_with', description: 'Impact metrics' },
    ],
    recentActivity: [
      { id: 'anderson-1', type: 'task_started', description: 'Started weekly scorecard model', timestamp: '2026-02-25T23:55:00Z' },
      { id: 'anderson-2', type: 'message', description: 'Sent margin assumptions to Astra', linkedAgent: 'astra', timestamp: '2026-02-25T22:20:00Z' },
      { id: 'anderson-3', type: 'flag', description: 'Flagged: missing vendor receipts', timestamp: '2026-02-25T18:10:00Z' },
    ],
  },
  {
    id: 'oracle',
    name: 'Oracle',
    emoji: '👁️',
    role: 'Security & Awareness',
    model: 'TBD',
    status: 'planned',
    avatar: '/assets/avatars/oracle.png',
    personalityBrief:
      'Focused on situational awareness and security posture. Designed to surface risks early and keep operations safe and informed.',
    capabilities: ['Threat monitoring and risk awareness', 'Security posture checks', 'Environmental scans'],
    boundaries: ['Not yet activated', 'No external actions without approval'],
    tools: ['Camera/Screen', 'Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Security priorities' },
      { targetAgent: 'dezayas', type: 'works_with', description: 'Infrastructure hardening' },
    ],
    recentActivity: [],
  },
  {
    id: 'pressy',
    name: 'Pressy',
    emoji: '📣',
    role: 'Communications',
    model: 'TBD',
    status: 'planned',
    avatar: '/assets/avatars/pressy.png',
    personalityBrief:
      'Communications specialist for external messaging, donor updates, and public-facing clarity. Designed to turn decisions into crisp, confident language.',
    capabilities: ['External comms drafting', 'Donor updates and PR support', 'Message positioning and tone'],
    boundaries: ['Not yet activated', 'No public posts without approval'],
    tools: ['Email', 'Telegram', 'Web Search'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Messaging priorities' },
      { targetAgent: 'astra', type: 'works_with', description: 'Strategy translation' },
    ],
    recentActivity: [],
  },
  {
    id: 'doc',
    name: 'Doc',
    emoji: '🩺',
    role: 'Health & Wellness',
    model: 'TBD',
    status: 'planned',
    avatar: '/assets/avatars/doc.png',
    personalityBrief:
      'Health and wellness advisor focused on sustainable performance and recovery. Built to keep the team sharp and resilient.',
    capabilities: ['Wellness check-ins', 'Recovery and performance guidance', 'Habit optimization'],
    boundaries: ['Not yet activated', 'No health guidance without approval'],
    tools: ['Web Search', 'Telegram'],
    relationships: [
      { targetAgent: 'ace', type: 'reports_to', description: 'Wellness priorities' },
    ],
    recentActivity: [],
  },
];

export const agentMap = agents.reduce<Record<string, Agent>>((acc, agent) => {
  acc[agent.id] = agent;
  return acc;
}, {});
