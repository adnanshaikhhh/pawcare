import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { detectSymptomCorrelations } from '@/lib/v2-ai';

export async function GET(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('symptom_correlations')
    .select('*')
    .eq('resolved', false)
    .order('detected_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const client = userSupabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const { data: pets } = await client.from('pets').select('id, name');
    const { data: recentSymptoms } = await client.from('symptom_checks').select('*').order('created_at', { ascending: false }).limit(30);
    const correlation = await detectSymptomCorrelations({
      familyPets: pets || [],
      recentSymptomChecks: recentSymptoms || [],
      sharedEnvironment: body.shared_environment || 'shared living spaces',
    });
    if (!correlation.hasCorrelation) {
      return NextResponse.json({ data: { correlation, message: 'No correlations detected' } });
    }
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', (await client.auth.getUser()).data.user?.id).single();
    const { data, error } = await client.from('symptom_correlations').insert({
      family_group_id: profile?.family_group_id,
      symptom_signature: 'multi-' + Date.now(),
      affected_pet_ids: correlation.affectedPetIds,
      possible_causes: correlation.possibleCauses,
      shared_environment: correlation.sharedEnvironment,
      ai_analysis: JSON.stringify(correlation),
      correlation_strength: correlation.confidence,
    }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data: { ...data, correlation } });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}