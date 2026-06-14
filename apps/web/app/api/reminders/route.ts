import { NextResponse } from 'next/server';
import { reminderSchema } from '@/lib/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function GET(req: Request) {
  const { response } = await requireUser();
  if (response) return response;
  const url = new URL(req.url);
  const includeCompleted = url.searchParams.get('include_completed') === 'true';

  const supabase = createSupabaseServerClient();
  let q = supabase
    .from('reminders')
    .select('*, pets(name, photo_url)')
    .order('reminder_at', { ascending: true });
  if (!includeCompleted) q = q.eq('is_completed', false);
  const { data, error } = await q.limit(200);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  try {
    const body = await req.json();
    const input = reminderSchema.parse(body);
    const supabase = createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_group_id')
      .eq('id', user.id)
      .single();
    const { data, error } = await supabase
      .from('reminders')
      .insert({ ...input, family_group_id: profile?.family_group_id ?? null, created_by: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  try {
    const body = (await req.json()) as { id: string; is_completed?: boolean };
    const supabase = createSupabaseServerClient();
    const updates: Record<string, unknown> = {};
    if (typeof body.is_completed === 'boolean') {
      updates.is_completed = body.is_completed;
      updates.completed_by = body.is_completed ? user.id : null;
      updates.completed_at = body.is_completed ? new Date().toISOString() : null;
    }
    const { data, error } = await supabase
      .from('reminders')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
