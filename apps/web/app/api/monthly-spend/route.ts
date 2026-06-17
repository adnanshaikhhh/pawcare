import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client.from('monthly_spend_summary').select('*').order('month_year', { ascending: false }).limit(12);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}