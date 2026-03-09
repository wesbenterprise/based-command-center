import { NextResponse } from 'next/server';
import { emailSupabase } from '../../../../lib/email-supabase';

export async function GET() {
  try {
    const { data: emails, error } = await emailSupabase
      .from('flagged_emails')
      .select('*')
      .eq('status', 'active')
      .order('received_at', { ascending: false });

    if (error) throw error;

    const { data: ratings } = await emailSupabase
      .from('email_ratings')
      .select('flagged_email_id, rating');

    const ratingsMap: Record<string, string> = {};
    if (ratings) {
      ratings.forEach((r: any) => { ratingsMap[r.flagged_email_id] = r.rating; });
    }

    return NextResponse.json({ emails: emails || [], ratings: ratingsMap });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
