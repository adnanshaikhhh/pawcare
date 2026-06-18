import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { checkMedicationInteractions } from '@/lib/v2-ai';

export async function GET(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  const { data: medications, error } = await client
    .from('medications')
    .select('id, medicine_name, purpose, is_active, pet_id')
    .eq('is_active', true);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  const interactions = await checkMedicationInteractions(medications || []);
  return NextResponse.json({ data: { medications, interactions } });
}