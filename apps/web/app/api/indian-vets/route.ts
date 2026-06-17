import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const url = new URL(request.url);
  const city = url.searchParams.get('city');
  const query = supabase.from('indian_vets').select('*').order('rating', { ascending: false, nullsFirst: false }).limit(50);
  const { data, error } = city ? await query.ilike('city', `%${city}%`) : await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}