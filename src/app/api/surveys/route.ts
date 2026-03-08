import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*, survey_questions(count), survey_responses(count)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const enriched = (surveys || []).map((survey) => ({
    ...survey,
    question_count: survey.survey_questions?.[0]?.count ?? 0,
    response_count: survey.survey_responses?.[0]?.count ?? 0,
    survey_questions: undefined,
    survey_responses: undefined,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, questions } = body;

  if (!title || !description || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: 'title, description, and questions are required' }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .insert({ title, description, slug, status: 'active' })
    .select()
    .single();

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 500 });
  }

  const rows = questions.map((q: { text: string; type: string; options?: string[]; required?: boolean }, i: number) => ({
    survey_id: survey.id,
    text: q.text,
    type: q.type,
    options: q.options || null,
    required: q.required ?? true,
    order_index: i,
  }));

  const { error: qError } = await supabase
    .from('survey_questions')
    .insert(rows);

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 });
  }

  return NextResponse.json(survey, { status: 201 });
}
