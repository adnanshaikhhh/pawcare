import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const dentalSchema = z.object({
  pet_id: z.string().uuid(),
  cleaning_date: z.string(),
  procedure_type: z.string().optional(),
  vet_name: z.string().optional(),
  grade: z.string().optional(),
  notes: z.string().optional(),
  next_due_date: z.string().optional(),
});

export async function GET(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('dental_records')
    .select('*, pets(name)')
    .order('cleaning_date', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = dentalSchema.parse(body);
    const { data, error } = await client.from('dental_records').insert({ ...input, logged_by: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}