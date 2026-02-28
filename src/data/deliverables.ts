export type DeliverableType =
  | 'report'
  | 'presentation'
  | 'site'
  | 'dashboard'
  | 'design'
  | 'document'
  | 'tool'
  | 'dataset';

export type DeliverableStatus = 'live' | 'draft' | 'archived';

export interface Deliverable {
  id: string;
  name: string;
  type: DeliverableType;
  status: DeliverableStatus;
  agentId: string;
  createdAt: string;
  updatedAt?: string;
  description: string;
  project?: string;
  projectLabel?: string;
  tags?: string[];
  url?: string;
  downloadUrl?: string;
  filePath?: string;
  previewImage?: string;
  version?: string;
  fileSize?: string;
  format?: string;
}

export interface DeliverableFilters {
  agent?: string;
  type?: DeliverableType;
  project?: string;
  search?: string;
  status?: DeliverableStatus;
}

export const deliverables: Deliverable[] = [
  {
    id: 'based-team-overview-v3',
    name: 'BASeD Team Overview v3',
    type: 'presentation',
    status: 'live',
    agentId: 'ace',
    createdAt: '2026-02-26T18:59:00Z',
    description: 'Comprehensive deck covering team structure, agent roles, capabilities, and operational architecture. 22 slides with agent avatars and role breakdowns.',
    project: 'based-operations',
    projectLabel: 'BASeD Operations',
    downloadUrl: '/artifacts/BASeD-Team-Overview-v3.pdf',
    version: 'v3',
    fileSize: '923 KB',
    format: 'PDF',
  },
  {
    id: 'shs-lakeland-4yr-trends',
    name: 'SHS Lakeland 4-Year Trends',
    type: 'report',
    status: 'live',
    agentId: 'ace',
    createdAt: '2026-02-24T14:00:00Z',
    description: 'Four-year trend analysis of SHS Lakeland performance metrics. Enrollment, retention, and program outcomes with year-over-year comparisons.',
    project: 'shs-lakeland',
    projectLabel: 'SHS Lakeland',
    format: 'PDF',
  },
  {
    id: 'parker-street-bonds-site',
    name: 'Parker Street Bonds',
    type: 'site',
    status: 'live',
    agentId: 'dezayas',
    createdAt: '2026-02-20T16:30:00Z',
    description: 'Informational site for the Parker Street Community Bonds initiative. Public-facing, built on Next.js, deployed to Railway.',
    project: 'parker-street',
    projectLabel: 'Parker Street',
    url: 'https://parkerstreetbonds.com',
    format: 'Next.js',
  },
  {
    id: 'mayfair-portfolio-site',
    name: 'Mayfair Portfolio',
    type: 'site',
    status: 'live',
    agentId: 'dezayas',
    createdAt: '2026-02-18T11:00:00Z',
    description: 'Portfolio site for Mayfair properties. Showcase of holdings, investment thesis, and contact information.',
    project: 'mayfair',
    projectLabel: 'Mayfair',
    url: 'https://mayfairportfolio.com',
    format: 'Next.js',
  },
  {
    id: 'agent-avatars-v1',
    name: 'Agent Avatars',
    type: 'design',
    status: 'live',
    agentId: 'romero',
    createdAt: '2026-02-26T17:08:00Z',
    description: 'AI-generated profile avatars for the first five BASeD agents: Ace, Astra, Dezayas, Rybo, and Charles. Synthwave-noir aesthetic, 1024×1024 PNG.',
    project: 'based-operations',
    projectLabel: 'BASeD Operations',
    tags: ['branding', 'visual-identity'],
    format: 'PNG',
  },
  {
    id: 'day-one-founding-document',
    name: 'Day One — Founding Document',
    type: 'document',
    status: 'live',
    agentId: 'charles',
    createdAt: '2026-02-15T09:00:00Z',
    description: 'The founding narrative of BASeD and Barnett Family Partners. Historical context, mission statement, and the vision that started it all.',
    project: 'based-operations',
    projectLabel: 'BASeD Operations',
    format: 'Markdown',
  },
  {
    id: 'command-center-v3',
    name: 'BASeD Command Center v3',
    type: 'site',
    status: 'live',
    agentId: 'dezayas',
    createdAt: '2026-02-25T20:00:00Z',
    description: 'Unified operations hub merging the BASeD Dashboard and Barnett Office portal. HQ, Ops, Intel, Apps, and Chat tabs.',
    project: 'command-center',
    projectLabel: 'Command Center',
    url: 'https://based-command.up.railway.app',
    format: 'Next.js + FastAPI',
  },
  {
    id: 'gamification-spec',
    name: 'Gamification System Spec',
    type: 'document',
    status: 'draft',
    agentId: 'ace',
    createdAt: '2026-02-25T00:20:00Z',
    description: 'Full specification for the BASeD gamification layer: XP, levels, achievements, leaderboard, and agent progression mechanics.',
    project: 'command-center',
    projectLabel: 'Command Center',
    format: 'Markdown',
  },
  {
    id: 'email-triage-spec',
    name: 'Email Triage System Spec',
    type: 'document',
    status: 'draft',
    agentId: 'ace',
    createdAt: '2026-02-25T00:54:00Z',
    description: 'Specification for automated email triage: categorization, priority scoring, flagging, and escalation rules.',
    project: 'command-center',
    projectLabel: 'Command Center',
    format: 'Markdown',
  },
  {
    id: 'based-team-overview-v2',
    name: 'BASeD Team Overview v2',
    type: 'presentation',
    status: 'archived',
    agentId: 'ace',
    createdAt: '2026-02-26T17:59:00Z',
    updatedAt: '2026-02-26T18:55:00Z',
    description: 'Second iteration of the team overview deck. Superseded by v3.',
    project: 'based-operations',
    projectLabel: 'BASeD Operations',
    version: 'v2',
    fileSize: '672 KB',
    format: 'PDF',
  },
];
