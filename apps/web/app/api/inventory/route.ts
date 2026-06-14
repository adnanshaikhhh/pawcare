import { NextResponse } from 'next/server';
import { inventoryItemSchema, inventoryPurchaseSchema } from '@/lib/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  try {
    const body = await req.json();
    const input = inventoryItemSchema.parse(body);
    const supabase = createSupabaseServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('family_group_id')
      .eq('id', user.id)
      .single();
    const { data, error } = await supabase
      .from('inventory_items')
      .insert({ ...input, owner_id: user.id, family_group_id: profile?.family_group_id ?? null })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
