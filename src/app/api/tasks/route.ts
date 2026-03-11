import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MEMORY_PATH = '/Users/wrbopenclaw/.openclaw/workspace-ace/MEMORY.md';

export interface Task {
  id: string;
  priority: 'critical' | 'today' | 'waiting' | 'done';
  title: string;
  description: string;
  status: 'open' | 'blocked' | 'waiting' | 'done';
  blockedBy: 'wesley' | 'agent' | null;
}

function parseBlockedBy(title: string, description: string): 'wesley' | 'agent' | null {
  const full = (title + ' ' + description).toLowerCase();
  if (
    full.includes('waiting on wesley') ||
    full.includes('needs his edits') ||
    full.includes('needs your') ||
    full.includes('waiting on you') ||
    /wesley to /.test(full)
  ) {
    return 'wesley';
  }
  if (
    full.includes('agent') ||
    full.includes('dezayas') ||
    full.includes('rybo') ||
    full.includes('astra')
  ) {
    return 'agent';
  }
  return null;
}

function parseTaskLine(line: string): Task | null {
  // Match: - <emoji> **title** — description  OR  - <emoji> **title** - description
  const match = line.match(/^-\s+(🔴|🟡|🟢|⏳)\s+\*\*(.+?)\*\*(?:\s+[—\-]\s+(.+))?$/);
  if (!match) return null;

  const [, emoji, title, description = ''] = match;

  let priority: Task['priority'];
  let status: Task['status'];

  switch (emoji) {
    case '🔴':
      priority = 'critical';
      status = 'open';
      break;
    case '🟡':
      priority = 'today';
      status = 'open';
      break;
    case '🟢':
      priority = 'done';
      status = 'done';
      break;
    case '⏳':
      priority = 'waiting';
      status = 'waiting';
      break;
    default:
      return null;
  }

  const blockedBy = parseBlockedBy(title, description);

  // Elevate status to 'waiting' if blockedBy is set and status is open
  if (blockedBy === 'wesley' && status === 'open') {
    status = 'waiting';
  }

  const id = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 60);

  return { id, priority, title, description: description.trim(), status, blockedBy };
}

function parseCompletedLine(line: string): Task | null {
  // Match: - ✅ **title** — description (date)
  const match = line.match(/^-\s+✅\s+\*\*(.+?)\*\*(?:\s+[—\-]\s+(.+))?$/);
  if (!match) return null;
  const [, title, description = ''] = match;
  const id = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 60);
  return { id, priority: 'done', title, description: description.trim(), status: 'done', blockedBy: null };
}

function readTasks(): { tasks: Task[]; raw: string; sectionStart: number; sectionEnd: number } {
  const raw = fs.readFileSync(MEMORY_PATH, 'utf-8');
  const lines = raw.split('\n');

  let sectionStart = -1;
  let sectionEnd = lines.length;
  let completedStart = -1;
  let completedEnd = lines.length;
  const tasks: Task[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('## Open Action Items')) {
      sectionStart = i + 1;
    } else if (lines[i].startsWith('## Recently Completed')) {
      if (sectionStart !== -1 && sectionEnd === lines.length) sectionEnd = i;
      completedStart = i + 1;
    } else if (sectionStart !== -1 && sectionEnd === lines.length && lines[i].startsWith('## ')) {
      sectionEnd = i;
    } else if (completedStart !== -1 && completedEnd === lines.length && lines[i].startsWith('## ') && !lines[i].startsWith('## Recently Completed')) {
      completedEnd = i;
    }
  }

  // Parse open action items
  for (let i = sectionStart; i >= 0 && i < sectionEnd; i++) {
    if (lines[i].startsWith('- ')) {
      const task = parseTaskLine(lines[i]);
      if (task) tasks.push(task);
    }
  }

  // Parse recently completed
  for (let i = completedStart; i >= 0 && i < completedEnd; i++) {
    if (lines[i].startsWith('- ')) {
      const task = parseCompletedLine(lines[i]);
      if (task) tasks.push(task);
    }
  }

  return { tasks, raw, sectionStart, sectionEnd };
}

export async function GET() {
  try {
    const { tasks } = readTasks();
    return NextResponse.json({
      tasks,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    const raw = fs.readFileSync(MEMORY_PATH, 'utf-8');
    const lines = raw.split('\n');

    let sectionStart = -1;
    let sectionEnd = lines.length;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## Open Action Items')) {
        sectionStart = i + 1;
      } else if (sectionStart !== -1 && lines[i].startsWith('## ')) {
        sectionEnd = i;
        break;
      }
    }

    if (sectionStart === -1) {
      return NextResponse.json({ error: 'Could not find Open Action Items section' }, { status: 500 });
    }

    const emojiMap: Record<string, string> = {
      critical: '🔴',
      today: '🟡',
      done: '🟢',
      waiting: '⏳',
    };

    if (action === 'add') {
      const { priority = 'today', title, description = '' } = body;
      if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
      const emoji = emojiMap[priority] || '🟡';
      const newLine = description
        ? `- ${emoji} **${title}** — ${description}`
        : `- ${emoji} **${title}**`;
      // Insert after the section header, before the first blank line or next item
      lines.splice(sectionStart, 0, newLine);
    } else if (action === 'remove') {
      const { id, title } = body;
      for (let i = sectionStart; i < sectionEnd; i++) {
        if (!lines[i].startsWith('- ')) continue;
        const task = parseTaskLine(lines[i]);
        if (task && (task.id === id || task.title === title)) {
          lines.splice(i, 1);
          break;
        }
      }
    } else if (action === 'update') {
      const { id, title: searchTitle, priority, description, status } = body;
      for (let i = sectionStart; i < sectionEnd; i++) {
        if (!lines[i].startsWith('- ')) continue;
        const task = parseTaskLine(lines[i]);
        if (task && (task.id === id || task.title === searchTitle)) {
          const newPriority = priority || task.priority;
          const newDesc = description !== undefined ? description : task.description;
          const newTitle = body.newTitle || task.title;
          const emoji = emojiMap[newPriority] || emojiMap[task.priority] || '🟡';
          lines[i] = newDesc
            ? `- ${emoji} **${newTitle}** — ${newDesc}`
            : `- ${emoji} **${newTitle}**`;
          break;
        }
      }
    } else {
      return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }

    fs.writeFileSync(MEMORY_PATH, lines.join('\n'), 'utf-8');
    const { tasks } = readTasks();
    return NextResponse.json({ ok: true, tasks });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
