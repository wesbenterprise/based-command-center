import { NextRequest, NextResponse } from 'next/server';
import { emailSupabase } from '../../../../lib/email-supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flagged_email_id, gmail_id, agent, rating, subject, sender, sender_domain, category } = body;

    const { error } = await emailSupabase.from('email_ratings').upsert({
      flagged_email_id,
      gmail_id,
      agent: agent || 'unknown',
      rating,
      subject,
      sender,
      sender_domain,
      category: category || 'General',
      created_at: new Date().toISOString(),
    }, { onConflict: 'flagged_email_id' });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
