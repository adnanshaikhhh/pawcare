import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const goalSchema = z.object({
  pet_id: z.string().uuid(),
  start_weight_kg: z.number().positive(),
  target_weight_kg: z.number().positive(),
});

export async function GET(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  const { data, error } = await client.from('weight_goal_progress').select('*, pets(name, target_weight_kg)').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = goalSchema.parse(body);
    // Update pet target weight
    await client.from('pets').update({ target_weight_kg: input.target_weight_kg, weight_goal_set_at: new Date().toISOString() }).eq('id', input.pet_id);
    const { data, error } = await client.from('weight_goal_progress').insert(input).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}