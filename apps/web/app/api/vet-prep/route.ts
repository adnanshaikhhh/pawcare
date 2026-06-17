import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { generateVetPrepBrief } from '@/lib/v2-ai';

export async function GET(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  if (!petId) return NextResponse.json({ error: { message: 'pet_id required' } }, { status: 400 });
  const { data, error } = await client.from('vet_visit_prep_briefs').select('*').eq('pet_id', petId).order('generated_at', { ascending: false }).limit(5);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { pet_id, vet_visit_id } = await request.json();
    if (!pet_id) return NextResponse.json({ error: { message: 'pet_id required' } }, { status: 400 });

    const [pet, weightLogs, moodLogs, medications, recentVetVisits, upcomingVaccines] = await Promise.all([
      client.from('pets').select('*').eq('id', pet_id).single(),
      client.from('weight_logs').select('weight_kg, measured_at').eq('pet_id', pet_id).order('measured_at', { ascending: false }).limit(20),
      client.from('mood_logs').select('logged_date, mood, appetite, energy_level').eq('pet_id', pet_id).order('logged_date', { ascending: false }).limit(30),
      client.from('medications').select('medicine_name, purpose, is_active').eq('pet_id', pet_id).eq('is_active', true),
      client.from('vet_visits').select('visit_date, reason, diagnosis').eq('pet_id', pet_id).order('visit_date', { ascending: false }).limit(3),
      client.from('vaccinations').select('vaccine_name, next_due_date').eq('pet_id', pet_id).not('next_due_date', 'is', null).limit(3),
    ]);

    const brief = await generateVetPrepBrief({
      pet: pet.data || { id: pet_id, name: 'Unknown', species: 'cat' },
      weightLogs: weightLogs.data || [],
      moodLogs: moodLogs.data || [],
      medications: medications.data || [],
      recentVetVisits: recentVetVisits.data || [],
      upcomingVaccines: upcomingVaccines.data || [],
    });

    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();

    const { data, error } = await client.from('vet_visit_prep_briefs').insert({
      vet_visit_id,
      pet_id,
      family_group_id: profile?.family_group_id,
      ai_summary: brief,
      weight_trend: '',
      appetite_summary: '',
      mood_summary: '',
      suggested_questions: [],
      data: { generated: true },
    }).select().single();

    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data: { ...data, brief } }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}