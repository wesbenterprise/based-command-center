import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
);

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'critical' | 'today' | 'waiting' | 'done';
  status: 'open' | 'blocked' | 'waiting' | 'done';
  blocked_by: 'wesley' | 'agent' | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  sort_order: number;
}

// GET: fetch all tasks
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('agenda_tasks')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map snake_case DB fields to the format the frontend expects
    const tasks = (data || []).map((t: any) => ({
      id: t.id,
      priority: t.priority,
      title: t.title,
      description: t.description || '',
      status: t.status,
      blockedBy: t.blocked_by || null,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      sortOrder: t.sort_order,
    }));

    return NextResponse.json({
      tasks,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// POST: add, remove, update, or complete tasks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'action required' }, { status: 400 });
    }

    if (action === 'add') {
      const { priority = 'today', title, description = '', blocked_by = null, sort_order = 0 } = body;
      if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

      const status = blocked_by === 'wesley' ? 'waiting' : 'open';
      const { data, error } = await supabase
        .from('agenda_tasks')
        .insert({ title, description, priority, status, blocked_by, sort_order })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, task: data });
    }

    if (action === 'remove') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const { error } = await supabase.from('agenda_tasks').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === 'update') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (body.title !== undefined) updates.title = body.title;
      if (body.description !== undefined) updates.description = body.description;
      if (body.priority !== undefined) updates.priority = body.priority;
      if (body.status !== undefined) updates.status = body.status;
      if (body.blocked_by !== undefined) updates.blocked_by = body.blocked_by;
      if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

      const { data, error } = await supabase
        .from('agenda_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, task: data });
    }

    if (action === 'complete') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const { data, error } = await supabase
        .from('agenda_tasks')
        .update({
          priority: 'done',
          status: 'done',
          blocked_by: null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, task: data });
    }

    if (action === 'reopen') {
      const { id, priority = 'today' } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const { data, error } = await supabase
        .from('agenda_tasks')
        .update({
          priority,
          status: 'open',
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, task: data });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
