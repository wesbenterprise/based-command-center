export interface Task {
  id: number;
  name: string;
  project: string;
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual';
  health: 'green' | 'amber' | 'red';
  lastRun: string;
  nextRun?: string;
  active?: boolean;
  urgent?: boolean;
  assignedAgent?: string;
}

// Hardcoded fallback for SSR / offline
export const tasks: Task[] = [
  { id: 1, name: "Morning Briefing", project: "BASeD Core", frequency: "Daily", health: "green", lastRun: "2026-02-25 08:00", nextRun: "Tomorrow 08:00", assignedAgent: "ace" },
  { id: 2, name: "Email Triage", project: "Communications", frequency: "Daily", health: "green", lastRun: "2026-02-25 08:15", nextRun: "Tomorrow 08:15", assignedAgent: "ace" },
  { id: 3, name: "Calendar Sync", project: "BASeD Core", frequency: "Daily", health: "green", lastRun: "2026-02-25 07:00", nextRun: "Tomorrow 07:00", assignedAgent: "ace" },
  { id: 4, name: "Task Status Update", project: "BASeD Core", frequency: "Daily", health: "green", lastRun: "2026-02-25 09:00", nextRun: "Tomorrow 09:00", assignedAgent: "ace" },
  { id: 5, name: "News & Market Scan", project: "Intel", frequency: "Daily", health: "green", lastRun: "2026-02-25 06:30", nextRun: "Tomorrow 06:30", assignedAgent: "astra" },
  { id: 6, name: "Expense Logging", project: "Finance", frequency: "Daily", health: "green", lastRun: "2026-02-25 18:00", nextRun: "Tomorrow 18:00", assignedAgent: "anderson" },
  { id: 7, name: "Standing Order Review", project: "BASeD Core", frequency: "Daily", health: "green", lastRun: "2026-02-25 20:00", nextRun: "Tomorrow 20:00", assignedAgent: "ace" },
  { id: 8, name: "Evening Digest", project: "Communications", frequency: "Daily", health: "green", lastRun: "2026-02-24 21:00", nextRun: "Today 21:00", assignedAgent: "pressy" },
  { id: 9, name: "Weekly Scorecard", project: "Intel", frequency: "Weekly", health: "green", lastRun: "2026-02-23", nextRun: "Sun 2026-03-01", assignedAgent: "anderson" },
  { id: 10, name: "Portfolio Pulse", project: "Finance", frequency: "Weekly", health: "green", lastRun: "2026-02-23", nextRun: "Sun 2026-03-01", assignedAgent: "anderson" },
  { id: 11, name: "Competitive Intel Brief", project: "Intel", frequency: "Weekly", health: "green", lastRun: "2026-02-21", nextRun: "Fri 2026-02-28", assignedAgent: "astra" },
  { id: 12, name: "Agent Performance Review", project: "BASeD Core", frequency: "Weekly", health: "green", lastRun: "2026-02-23", nextRun: "Sun 2026-03-01", assignedAgent: "ace" },
  { id: 13, name: "Content Calendar Update", project: "Communications", frequency: "Weekly", health: "amber", lastRun: "2026-02-16", nextRun: "Overdue", assignedAgent: "pressy" },
  { id: 14, name: "Property Inspection Reports", project: "LHG", frequency: "Weekly", health: "green", lastRun: "2026-02-22", nextRun: "Sat 2026-03-01", assignedAgent: "julius" },
  { id: 15, name: "Vendor Payment Review", project: "Finance", frequency: "Weekly", health: "green", lastRun: "2026-02-21", nextRun: "Fri 2026-02-28", assignedAgent: "anderson" },
  { id: 16, name: "Monthly Financial Close", project: "Finance", frequency: "Monthly", health: "green", lastRun: "2026-01-31", nextRun: "2026-02-28", assignedAgent: "anderson" },
  { id: 17, name: "Investor Update Draft", project: "BFP", frequency: "Monthly", health: "green", lastRun: "2026-01-28", nextRun: "2026-02-28", assignedAgent: "pressy" },
  { id: 18, name: "Security Audit", project: "BASeD Core", frequency: "Monthly", health: "green", lastRun: "2026-02-01", nextRun: "2026-03-01", assignedAgent: "oracle" },
  { id: 19, name: "KPI Dashboard Refresh", project: "Intel", frequency: "Monthly", health: "green", lastRun: "2026-02-01", nextRun: "2026-03-01", assignedAgent: "anderson" },
  { id: 20, name: "Board Deck Preparation", project: "BFP", frequency: "Quarterly", health: "green", lastRun: "2026-01-15", nextRun: "2026-04-15", assignedAgent: "astra" },
  { id: 21, name: "Tax Planning Review", project: "Finance", frequency: "Quarterly", health: "green", lastRun: "2026-01-10", nextRun: "2026-04-10", assignedAgent: "anderson" },
  { id: 22, name: "Strategic Planning Session", project: "BFP", frequency: "Quarterly", health: "green", lastRun: "2026-01-20", nextRun: "2026-04-20", assignedAgent: "astra" },
  { id: 23, name: "Annual Budget Review", project: "Finance", frequency: "Annual", health: "green", lastRun: "2026-01-05", nextRun: "2027-01-05", assignedAgent: "anderson" },
  { id: 24, name: "Entity Compliance Audit", project: "Legal", frequency: "Annual", health: "green", lastRun: "2026-01-15", nextRun: "2027-01-15", assignedAgent: "charles" },
];
