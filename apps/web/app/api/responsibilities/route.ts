import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const respSchema = z.object({
  assignee_id: z.string().uuid(),
  pet_id: z.string().uuid().optional(),
  task_type: z.enum(['feeding', 'medication', 'litter', 'cleaning', 'walk', 'custom']),
  recurrence: z.enum(['daily', 'weekly', 'weekdays', 'custom']).optional(),
  time_of_day: z.string().optional(),
  notes: z.string().max(200).optional(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client.from('responsibilities').select('*, profiles:assignee_id(full_name, avatar_url), pets(name)').eq('active', true);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = respSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('responsibilities').insert({ ...input, family_group_id: profile?.family_group_id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: { message: 'id required' } }, { status: 400 });
  const { error } = await client.from('responsibilities').update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}