import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { petCreateSchema, petUpdateSchema } from '@/lib/shared';
import { handleZodError, rateLimit } from '@/lib/route-helpers';

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from('pets')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (response) return response;

  const rl = rateLimit(`pets:create:${user.id}`, 30, 60_000);
  if (!rl.ok) return NextResponse.json({ error: { message: 'Rate limit exceeded' } }, { status: 429 });

  try {
    const body = await request.json();
    const input = petCreateSchema.parse(body);

    const supabase = createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_group_id')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('pets')
      .insert({
        ...input,
        owner_id: user.id,
        family_group_id: profile?.family_group_id ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    const e = handleZodError(err);
    return NextResponse.json({ error: e }, { status: 400 });
  }
}

// unused but kept for completeness
export const _schemas = { petUpdateSchema };
