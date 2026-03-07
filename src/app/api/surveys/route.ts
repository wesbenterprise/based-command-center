import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get question counts and response counts for each survey
  const enriched = await Promise.all(
    (surveys || []).map(async (survey) => {
      const [{ count: questionCount }, { count: responseCount }] = await Promise.all([
        supabase.from('survey_questions').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id),
        supabase.from('survey_responses').select('*', { count: 'exact', head: true }).eq('survey_id', survey.id),
      ]);
      return { ...survey, question_count: questionCount || 0, response_count: responseCount || 0 };
    })
  );

  return NextResponse.json(enriched);
}
