import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const expenseSchema = z.object({
  pet_id: z.string().uuid().optional(),
  category: z.enum(['food', 'vet', 'medication', 'grooming', 'toys', 'other']),
  amount_inr: z.number().positive(),
  description: z.string().max(200).optional(),
  receipt_url: z.string().url().optional(),
  purchase_date: z.string(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('pet_expenses')
    .select('*, pets(name)')
    .order('purchase_date', { ascending: false })
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
    const input = expenseSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('pet_expenses').insert({ ...input, family_group_id: profile?.family_group_id, logged_by: user!.id }).select().single();
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
  const { error } = await client.from('pet_expenses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}