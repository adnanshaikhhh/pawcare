import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const profileUpdateSchema = z.object({
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  timezone: z.string().max(50).optional(),
});

export async function GET(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const supabase = userSupabase ?? userSupabase ?? createSupabaseServerClient();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const supabase = userSupabase ?? userSupabase ?? createSupabaseServerClient();
  try {
    const raw = await request.json();
    const parsed = profileUpdateSchema.parse(raw);
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user!.id, ...parsed, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    const e = handleZodError(err);
    return NextResponse.json({ error: e }, { status: 400 });
  }
}
