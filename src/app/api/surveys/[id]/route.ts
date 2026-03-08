import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: survey, error: surveyError }, { data: questions, error: questionsError }] = await Promise.all([
    supabase.from('surveys').select('*').eq('id', id).single(),
    supabase.from('survey_questions').select('*').eq('survey_id', id).order('order_index'),
  ]);

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 404 });
  }
  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 500 });
  }

  return NextResponse.json({ ...survey, questions: questions || [] });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.title) updates.title = body.title;
  if (body.description) updates.description = body.description;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('surveys')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Delete questions and responses first, then the survey
  const { error: respError } = await supabase
    .from('survey_responses')
    .delete()
    .eq('survey_id', id);

  if (respError) {
    return NextResponse.json({ error: respError.message }, { status: 500 });
  }

  const { error: qError } = await supabase
    .from('survey_questions')
    .delete()
    .eq('survey_id', id);

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 });
  }

  const { error: surveyError } = await supabase
    .from('surveys')
    .delete()
    .eq('id', id);

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
