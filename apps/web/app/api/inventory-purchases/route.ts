import { NextResponse } from 'next/server';
import { inventoryPurchaseSchema } from '@pawcare/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function GET(req: Request) {
  const { response } = await requireUser();
  if (response) return response;
  const url = new URL(req.url);
  const itemId = url.searchParams.get('item_id');
  if (!itemId) return NextResponse.json({ error: { message: 'item_id required' } }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('inventory_purchases')
    .select('*')
    .eq('item_id', itemId)
    .order('purchase_date', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (response) return response;
  try {
    const body = await req.json();
    const input = inventoryPurchaseSchema.parse(body);
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('inventory_purchases')
      .insert({ ...input, logged_by: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });

    // Update the parent item's last purchase fields
    await supabase
      .from('inventory_items')
      .update({
        last_purchased_date: input.purchase_date,
        last_purchased_quantity: input.quantity ?? null,
        last_purchased_cost_inr: input.cost_inr ?? null,
      })
      .eq('id', input.item_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
