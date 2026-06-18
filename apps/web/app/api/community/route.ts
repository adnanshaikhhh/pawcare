import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const postSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().max(2000).optional(),
  category: z.enum(['question', 'story', 'advice', 'lost_found']).optional(),
  city: z.string().optional(),
  pet_id: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const url = new URL(request.url);
  const city = url.searchParams.get('city');
  let query = supabase.from('community_posts').select('*, profiles:author_id(full_name, avatar_url), pets(name)').order('created_at', { ascending: false }).limit(50);
  if (city) query = query.ilike('city', `%${city}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = postSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('community_posts').insert({ ...input, family_group_id: profile?.family_group_id, author_id: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}