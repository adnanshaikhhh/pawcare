import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  const year = url.searchParams.get('year');
  if (!petId || !year) return NextResponse.json({ error: { message: 'pet_id and year required' } }, { status: 400 });
  const { data, error } = await client.from('pet_year_reviews').select('*, pets(name, photo_url, date_of_birth)').eq('pet_id', petId).eq('year', parseInt(year)).single();
  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ data: null, message: 'No year review yet for this pet/year' });
  }
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { pet_id, year, review_data } = await request.json();
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', (await client.auth.getUser()).data.user?.id).single();
    const { data, error } = await client.from('pet_year_reviews').upsert({
      pet_id, year, review_data, family_group_id: profile?.family_group_id,
    }, { onConflict: 'pet_id,year' }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}