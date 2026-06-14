import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const profileUpdateSchema = z.object({
  full_name: z.string().max(100).optional(),
  avatar_url: z.string().url().optional().nullable(),
  timezone: z.string().max(50).optional(),
});

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ data: null });
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 });
  try {
    const raw = await req.json();
    const parsed = profileUpdateSchema.parse(raw);
    const { data, error } = await supabase
      .from('profiles')
      .update(parsed)
      .eq('id', user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
