import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const activitySchema = z.object({
  pet_id: z.string().uuid().optional(),
  activity_type: z.enum(['fed', 'medication', 'walk', 'play', 'groom', 'vet', 'custom']),
  details: z.record(z.any()).optional(),
  photo_url: z.string().url().optional(),
  notes: z.string().max(500).optional(),
  occurred_at: z.string().optional(),
});

export async function GET(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();

  const { data, error } = await client
    .from('activity_timeline')
    .select('*, pets(name, photo_url), profiles:actor_id(full_name, avatar_url)')
    .order('occurred_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();

  try {
    const body = await request.json();
    const input = activitySchema.parse(body);

    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();

    const { data, error } = await client
      .from('activity_timeline')
      .insert({
        ...input,
        family_group_id: profile?.family_group_id,
        actor_id: user!.id,
        occurred_at: input.occurred_at || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
