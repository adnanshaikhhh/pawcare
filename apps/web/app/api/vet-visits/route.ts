import { NextResponse } from 'next/server';
import { vetVisitSchema } from '@pawcare/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function GET(req: Request) {
  const { response } = await requireUser();
  if (response) return response;
  const url = new URL(req.url);
  const petId = url.searchParams.get('pet_id');
  if (!petId) return NextResponse.json({ error: { message: 'pet_id required' } }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('vet_visits')
    .select('*')
    .eq('pet_id', petId)
    .order('visit_date', { ascending: false });

  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  try {
    const body = await req.json();
    const input = vetVisitSchema.parse(body);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('vet_visits')
      .insert({ ...input, logged_by: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
