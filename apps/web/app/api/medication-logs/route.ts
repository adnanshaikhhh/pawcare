import { NextResponse } from 'next/server';
import { medicationLogSchema } from '@pawcare/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  try {
    const body = await req.json();
    const input = medicationLogSchema.parse(body);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('medication_logs')
      .insert({ ...input, given_by: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { response } = await requireUser();
  if (response) return response;
  const url = new URL(req.url);
  const medicationId = url.searchParams.get('medication_id');
  if (!medicationId) return NextResponse.json({ error: { message: 'medication_id required' } }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('medication_logs')
    .select('*')
    .eq('medication_id', medicationId)
    .order('given_at', { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}
