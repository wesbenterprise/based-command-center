import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('saved_prompts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const { title, prompt_text, tags } = await req.json();

  if (!title || !prompt_text) {
    return NextResponse.json({ error: 'title and prompt_text are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('saved_prompts')
    .insert({ title, prompt_text, tags: tags ?? [] })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompt: data });
}

export async function PUT(req: NextRequest) {
  const { id, title, prompt_text, tags } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (prompt_text !== undefined) updates.prompt_text = prompt_text;
  if (tags !== undefined) updates.tags = tags;

  const { data, error } = await supabase
    .from('saved_prompts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompt: data });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('saved_prompts')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
