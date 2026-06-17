import { NextResponse } from 'next/server';
import { petUpdateSchema } from '@/lib/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireUser(req);
  if (response) return response;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('pets').select('*').eq('id', params.id).single();
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireUser(req);
  if (response) return response;
  try {
    const body = await req.json();
    const input = petUpdateSchema.parse(body);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('pets')
      .update(input)
      .eq('id', params.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { user, response } = await requireUser(req);
  if (response) return response;
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('pets').delete().eq('id', params.id).eq('owner_id', user.id);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data: { deleted: true } });
}
