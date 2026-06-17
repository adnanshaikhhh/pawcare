import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const labSchema = z.object({
  pet_id: z.string().uuid(),
  test_date: z.string(),
  lab_name: z.string().optional(),
  source_image_url: z.string().url().optional(),
  ai_extracted_values: z.record(z.any()),
  flagged_abnormalities: z.array(z.string()).optional(),
  ai_summary: z.string().optional(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('lab_results')
    .select('*, pets(name)')
    .order('test_date', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = labSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('lab_results').insert({ ...input, family_group_id: profile?.family_group_id, uploaded_by: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}