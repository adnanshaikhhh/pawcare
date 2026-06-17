import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  const year = url.searchParams.get('year');
  let query = client.from('birthday_cards').select('*, pets(name, photo_url, date_of_birth)').order('generated_at', { ascending: false });
  if (petId) query = query.eq('pet_id', petId);
  if (year) query = query.eq('year', parseInt(year));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { pet_id, year, card_data } = await request.json();
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', (await client.auth.getUser()).data.user?.id).single();
    const { data, error } = await client.from('birthday_cards').upsert({
      pet_id, year, card_data, family_group_id: profile?.family_group_id,
    }, { onConflict: 'pet_id,year' }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}