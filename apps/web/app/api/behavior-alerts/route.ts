import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('behavior_alerts')
    .select('*, pets(name, photo_url)')
    .eq('acknowledged', false)
    .order('detected_at', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { id } = await request.json();
    const { data, error } = await client
      .from('behavior_alerts')
      .update({ acknowledged: true, acknowledged_by: user!.id })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}