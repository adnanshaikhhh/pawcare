import { NextResponse, type NextRequest } from 'next/server';
import { symptomCheckSchema } from '@pawcare/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { aiSymptomCheck } from '@/lib/ai';
import { handleZodError, rateLimit } from '@/lib/route-helpers';

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  // Rate limit: 10 per day per user
  const rl = rateLimit(`ai:symptom:${user.id}`, 10, 24 * 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: { message: 'Daily AI check limit reached. Try again tomorrow.' } }, { status: 429 });
  }

  try {
    const body = await request.json();
    const input = symptomCheckSchema.parse(body);
    const supabase = createSupabaseServerClient();

    const { data: pet } = await supabase
      .from('pets')
      .select('*')
      .eq('id', input.pet_id)
      .single();
    if (!pet) return NextResponse.json({ error: { message: 'Pet not found' } }, { status: 404 });

    const { data: recentMeds } = await supabase
      .from('medications')
      .select('medicine_name, dosage')
      .eq('pet_id', input.pet_id)
      .eq('is_active', true);
    const { data: lastMood } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('pet_id', input.pet_id)
      .order('logged_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const result = await aiSymptomCheck(input.symptoms_described, pet, {
      recentMedications: (recentMeds ?? []).map((m) => `${m.medicine_name} ${m.dosage ?? ''}`),
      lastMood: lastMood ?? null,
    });

    const { data: saved, error: saveErr } = await supabase
      .from('symptom_checks')
      .insert({
        pet_id: input.pet_id,
        symptoms_described: input.symptoms_described,
        ai_assessment: result.possible_causes.join('; '),
        urgency_level: result.urgency,
        ai_suggestions: JSON.stringify(result),
        checked_by: user.id,
      })
      .select()
      .single();
    if (saveErr) console.error('Failed to save symptom check:', saveErr);

    return NextResponse.json({ data: { result, check_id: saved?.id } });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
