import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { generatePetProfilePdf } from '@/lib/pdf-export';

export async function GET(_req: Request, { params }: { params: { petId: string } }) {
  const { response } = await requireUser();
  if (response) return response;
  const supabase = createSupabaseServerClient();
  const { data: pet } = await supabase.from('pets').select('*').eq('id', params.petId).single();
  if (!pet) return NextResponse.json({ error: { message: 'Pet not found' } }, { status: 404 });

  const [vaccinations, medications, deworming, weightLogs, vetVisits, medicationLogs] = await Promise.all([
    supabase.from('vaccinations').select('*').eq('pet_id', params.petId).order('date_given', { ascending: false }),
    supabase.from('medications').select('*').eq('pet_id', params.petId).order('created_at', { ascending: false }),
    supabase.from('deworming_records').select('*').eq('pet_id', params.petId).order('date_given', { ascending: false }),
    supabase.from('weight_logs').select('*').eq('pet_id', params.petId).order('measured_at', { ascending: false }),
    supabase.from('vet_visits').select('*').eq('pet_id', params.petId).order('visit_date', { ascending: false }),
    supabase.from('medication_logs').select('*').eq('pet_id', params.petId).order('given_at', { ascending: false }),
  ]);

  const doc = generatePetProfilePdf({
    pet,
    vaccinations: vaccinations.data ?? [],
    medications: medications.data ?? [],
    deworming: deworming.data ?? [],
    weightLogs: weightLogs.data ?? [],
    vetVisits: vetVisits.data ?? [],
    medicationLogs: medicationLogs.data ?? [],
  });

  const pdfBuffer = doc.output('arraybuffer');
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="pawcare-${pet.name.toLowerCase().replace(/\s+/g, '-')}.pdf"`,
    },
  });
}
