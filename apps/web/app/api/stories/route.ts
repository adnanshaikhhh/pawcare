import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { handleZodError, rateLimit } from '@/lib/route-helpers';
import { z } from 'zod';

const createStorySchema = z.object({
  pet_id: z.string().uuid(),
  media_url: z.string().min(1),
  media_type: z.enum(['photo', 'video']).default('photo'),
  caption: z.string().max(280).optional().nullable(),
  detected_pet_id: z.string().uuid().optional().nullable(),
  ai_confidence: z.number().min(0).max(1).optional().nullable(),
});

export async function GET(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const supabase = userSupabase!;

  const { searchParams } = new URL(request.url);
  const familyOnly = searchParams.get('family') !== 'false';

  let query = supabase
    .from('pet_stories')
    .select('*, pet:pets!pet_stories_pet_id_fkey(id, name, photo_url, species), creator:profiles!pet_stories_created_by_fkey(id, full_name, avatar_url)')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);

  if (familyOnly) {
    const { data: profile } = await supabase.from('profiles').select('family_group_id').eq('id', user.id).single();
    if (profile?.family_group_id) {
      query = query.eq('family_group_id', profile.family_group_id);
    }
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const supabase = userSupabase!;

  const rl = rateLimit(`stories:create:${user.id}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: { message: 'Rate limit exceeded' } }, { status: 429 });

  try {
    const body = await request.json();
    const input = createStorySchema.parse(body);
    const { data: profile } = await supabase.from('profiles').select('family_group_id').eq('id', user.id).single();

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('pet_stories')
      .insert({
        ...input,
        created_by: user.id,
        family_group_id: profile?.family_group_id ?? null,
        expires_at: expiresAt,
      })
      .select('*, pet:pets!pet_stories_pet_id_fkey(id, name, photo_url, species), creator:profiles!pet_stories_created_by_fkey(id, full_name, avatar_url)')
      .single();

    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
