import { NextResponse } from 'next/server';
import { dewormingSchema, weightLogSchema, moodLogSchema, heatCycleSchema } from '@/lib/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

async function readTable(
  table: 'deworming_records' | 'weight_logs' | 'mood_logs' | 'heat_cycles',
  petId: string,
  userSupabase: ReturnType<typeof createSupabaseServerClient> | null
) {
  const supabase = userSupabase ?? createSupabaseServerClient();
  const orderCol = table === 'weight_logs' ? 'measured_at' : table === 'mood_logs' ? 'logged_date' : 'date_given';
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('pet_id', petId)
    .order(orderCol, { ascending: false });
  if (error) throw error;
  return data;
}

export async function GET(req: Request, { params }: { params: { type: string; petId: string } }) {
  const { response, supabase: userSupabase } = await requireUser(req);
  if (response) return response;
  const { type, petId } = params;
  try {
    let data;
    switch (type) {
      case 'deworming':
      case 'weight':
      case 'mood':
      case 'heat-cycles':
        data = await readTable(
          type === 'heat-cycles' ? 'heat_cycles' : (type as 'deworming_records' | 'weight_logs' | 'mood_logs'),
          petId,
          userSupabase
        );
        break;
      default:
        return NextResponse.json({ error: { message: 'Unknown type' } }, { status: 400 });
    }
    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { type: string; petId: string } }) {
  const { user, response, supabase: userSupabase } = await requireUser(req);
  if (response) return response;
  const { type, petId } = params;
  try {
    const body = await req.json();
    let parsed;
    let table: string;
    switch (type) {
      case 'deworming':
        parsed = dewormingSchema.parse({ ...body, pet_id: petId });
        table = 'deworming_records';
        break;
      case 'weight':
        parsed = weightLogSchema.parse({ ...body, pet_id: petId });
        table = 'weight_logs';
        break;
      case 'mood':
        parsed = moodLogSchema.parse({ ...body, pet_id: petId });
        table = 'mood_logs';
        break;
      case 'heat-cycles':
        parsed = heatCycleSchema.parse({ ...body, pet_id: petId });
        table = 'heat_cycles';
        break;
      default:
        return NextResponse.json({ error: { message: 'Unknown type' } }, { status: 400 });
    }
    const supabase = userSupabase ?? createSupabaseServerClient();
    const { data, error } = await supabase
      .from(table)
      .insert({ ...parsed, logged_by: user.id })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
