import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('smart_reminder_suggestions')
    .select('*')
    .eq('dismissed', false)
    .order('suggested_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  try {
    const { id, action } = await request.json();
    const update = action === 'dismiss' ? { dismissed: true } : { acted_upon: true };
    const { data, error } = await client.from('smart_reminder_suggestions').update(update).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}