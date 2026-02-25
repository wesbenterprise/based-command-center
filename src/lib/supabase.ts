import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://srhruxvcwuuxbivqxemo.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyaHJ1eHZjd3V1eGJpdnF4ZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5ODMyMTMsImV4cCI6MjA4NzU1OTIxM30.9JyCfNQ-ie1eUzr6yEtFINhZPoiTvRzwE9DRLM3U754';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
