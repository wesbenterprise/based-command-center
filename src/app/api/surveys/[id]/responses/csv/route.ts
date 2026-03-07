import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: survey }, { data: questions }, { data: responses, error }] = await Promise.all([
    supabase.from('surveys').select('title').eq('id', id).single(),
    supabase.from('survey_questions').select('id, text').eq('survey_id', id).order('order_index'),
    supabase.from('survey_responses').select('*').eq('survey_id', id).order('created_at', { ascending: false }),
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const questionList = questions || [];
  const responseList = responses || [];

  // Build CSV
  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headers = ['Response ID', 'Respondent', 'Submitted At', ...questionList.map(q => q.text)];
  const rows = responseList.map(r => {
    const answers = typeof r.answers === 'object' ? r.answers : {};
    return [
      r.id,
      r.respondent_name || r.respondent_email || 'Anonymous',
      r.created_at ? new Date(r.created_at).toISOString() : '',
      ...questionList.map(q => {
        const val = answers[q.id] ?? answers[q.text] ?? '';
        return typeof val === 'object' ? JSON.stringify(val) : String(val);
      }),
    ];
  });

  const csv = [headers.map(escapeCsv).join(','), ...rows.map(r => r.map(c => escapeCsv(String(c))).join(','))].join('\n');

  const filename = `${(survey?.title || 'survey').replace(/[^a-zA-Z0-9]/g, '_')}_responses.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
