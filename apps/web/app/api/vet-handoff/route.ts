import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const handoffSchema = z.object({
  vet_visit_id: z.string().uuid(),
  estimated_return: z.string().optional(),
});

export async function GET(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  const activeOnly = url.searchParams.get('active') !== 'false';
  let query = client
    .from('vet_visit_handoffs')
    .select('*, profiles:traveler_id(full_name, avatar_url), pets(name)')
    .order('started_at', { ascending: false });
  if (petId) query = query.eq('pet_id', petId);
  if (activeOnly) query = query.is('ended_at', null);
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
    const input = handoffSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('vet_visit_handoffs').insert({ ...input, family_group_id: profile?.family_group_id, traveler_id: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  try {
    const { id, action, update_text } = await request.json();
    const updates: Record<string, any> = {};
    if (action === 'end') updates.ended_at = new Date().toISOString();
    if (update_text) {
      // append to live_updates
      const { data: handoff } = await client.from('vet_visit_handoffs').select('live_updates').eq('id', id).single();
      const updates_list = (handoff?.live_updates as any[]) || [];
      updates.live_updates = [...updates_list, { text: update_text, at: new Date().toISOString(), by: user!.id }];
    }
    const { data, error } = await client.from('vet_visit_handoffs').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}