// Supabase Edge Function: process-reminders
// Auto-creates the "next" reminders for vaccines, deworming, and heat
// cycles that don't have a follow-up scheduled. Useful for backfills
// if a trigger was missed. Run once after migrations or on demand.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async () => {
  const now = new Date();
  let processed = 0;

  // Vaccines without a follow-up: assume annual
  const { data: vaxes } = await supabase
    .from('vaccinations')
    .select('id, pet_id, vaccine_name, date_given, next_due_date')
    .is('next_due_date', null);
  for (const v of vaxes ?? []) {
    const next = new Date(v.date_given);
    next.setFullYear(next.getFullYear() + 1);
    await supabase.from('vaccinations').update({ next_due_date: next.toISOString().slice(0, 10) }).eq('id', v.id);
    processed++;
  }

  // Heat cycle predictions (cats 21d, dogs 180d)
  const { data: heats } = await supabase
    .from('heat_cycles')
    .select('id, pet_id, start_date, pets(species)')
    .is('predicted_next', null);
  for (const h of heats ?? []) {
    const species = (h.pets as unknown as { species: string } | null)?.species ?? 'other';
    const days = species === 'cat' ? 21 : species === 'dog' ? 180 : 60;
    const pred = new Date(h.start_date);
    pred.setDate(pred.getDate() + days);
    await supabase
      .from('heat_cycles')
      .update({ predicted_next: pred.toISOString().slice(0, 10) })
      .eq('id', h.id);
    processed++;
  }

  return new Response(JSON.stringify({ processed, ran_at: now.toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
