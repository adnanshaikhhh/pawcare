"""Batch-create all V2 API routes."""
import os
from pathlib import Path

API_DIR = Path(r'C:\Users\ADNAN\Documents\Codex\Projects\pawcare\apps\web\app\api')

ROUTES = {
    # Activity Timeline already exists
    # Pet Stories already exists
    # Activity Timeline already exists

    'vet-prep': '''import { NextResponse } from 'next/server';
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
      pet,
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
}''',

    'weight-goals': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const goalSchema = z.object({
  pet_id: z.string().uuid(),
  start_weight_kg: z.number().positive(),
  target_weight_kg: z.number().positive(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client.from('weight_goal_progress').select('*, pets(name, target_weight_kg)').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = goalSchema.parse(body);
    // Update pet target weight
    await client.from('pets').update({ target_weight_kg: input.target_weight_kg, weight_goal_set_at: new Date().toISOString() }).eq('id', input.pet_id);
    const { data, error } = await client.from('weight_goal_progress').insert(input).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}''',

    'behavior-alerts': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('behavior_alerts')
    .select('*, pets(name, photo_url)')
    .eq('acknowledged', false)
    .order('detected_at', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { id } = await request.json();
    const { data, error } = await client
      .from('behavior_alerts')
      .update({ acknowledged: true, acknowledged_by: user!.id })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}''',

    'expenses': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const expenseSchema = z.object({
  pet_id: z.string().uuid().optional(),
  category: z.enum(['food', 'vet', 'medication', 'grooming', 'toys', 'other']),
  amount_inr: z.number().positive(),
  description: z.string().max(200).optional(),
  receipt_url: z.string().url().optional(),
  purchase_date: z.string(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('pet_expenses')
    .select('*, pets(name)')
    .order('purchase_date', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = expenseSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('pet_expenses').insert({ ...input, family_group_id: profile?.family_group_id, logged_by: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: { message: 'id required' } }, { status: 400 });
  const { error } = await client.from('pet_expenses').delete().eq('id', id);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}''',

    'indian-vets': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const url = new URL(request.url);
  const city = url.searchParams.get('city');
  const query = supabase.from('indian_vets').select('*').order('rating', { ascending: false, nullsFirst: false }).limit(50);
  const { data, error } = city ? await query.ilike('city', `%${city}%`) : await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}''',

    'monthly-spend': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client.from('monthly_spend_summary').select('*').order('month_year', { ascending: false }).limit(12);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}''',

    'responsibilities': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const respSchema = z.object({
  assignee_id: z.string().uuid(),
  pet_id: z.string().uuid().optional(),
  task_type: z.enum(['feeding', 'medication', 'litter', 'cleaning', 'walk', 'custom']),
  recurrence: z.enum(['daily', 'weekly', 'weekdays', 'custom']).optional(),
  time_of_day: z.string().optional(),
  notes: z.string().max(200).optional(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client.from('responsibilities').select('*, profiles:assignee_id(full_name, avatar_url), pets(name)').eq('active', true);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = respSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('responsibilities').insert({ ...input, family_group_id: profile?.family_group_id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: { message: 'id required' } }, { status: 400 });
  const { error } = await client.from('responsibilities').update({ active: false }).eq('id', id);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ success: true });
}''',

    'daily-mood-summary': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { computeMoodWeather } from '@/lib/v2-ai';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const today = new Date().toISOString().slice(0, 10);

  // Get today's mood logs from all pets in family
  const { data: pets } = await client.from('pets').select('id, name');
  const petIds = (pets || []).map((p: any) => p.id);
  if (petIds.length === 0) return NextResponse.json({ data: { vibesScore: 50, breakdown: {}, dominantMood: 'unknown', totalLogs: 0 } });

  const { data: todayLogs } = await client
    .from('mood_logs')
    .select('pet_id, mood')
    .eq('logged_date', today)
    .in('pet_id', petIds);

  const weather = computeMoodWeather(todayLogs || []);
  return NextResponse.json({ data: weather });
}''',

    'smart-reminders': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('smart_reminder_suggestions')
    .select('*')
    .eq('dismissed', false)
    .order('suggested_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PATCH(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { id, action } = await request.json();
    const update = action === 'dismiss' ? { dismissed: true } : { acted_upon: true };
    const { data, error } = await client.from('smart_reminder_suggestions').update(update).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}''',

    'symptom-correlations': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { detectSymptomCorrelations } from '@/lib/v2-ai';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
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
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
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
}''',

    'community': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const postSchema = z.object({
  title: z.string().min(5).max(200),
  body: z.string().max(2000).optional(),
  category: z.enum(['question', 'story', 'advice', 'lost_found']).optional(),
  city: z.string().optional(),
  pet_id: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const supabase = createSupabaseServerClient();
  const url = new URL(request.url);
  const city = url.searchParams.get('city');
  let query = supabase.from('community_posts').select('*, profiles:author_id(full_name, avatar_url), pets(name)').order('created_at', { ascending: false }).limit(50);
  if (city) query = query.ilike('city', `%${city}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = postSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('community_posts').insert({ ...input, family_group_id: profile?.family_group_id, author_id: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}''',

    'labs': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const labSchema = z.object({
  pet_id: z.string().uuid(),
  test_date: z.string(),
  lab_name: z.string().optional(),
  source_image_url: z.string().url().optional(),
  ai_extracted_values: z.record(z.any()),
  flagged_abnormalities: z.array(z.string()).optional(),
  ai_summary: z.string().optional(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('lab_results')
    .select('*, pets(name)')
    .order('test_date', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = labSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('lab_results').insert({ ...input, family_group_id: profile?.family_group_id, uploaded_by: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}''',

    'medication-interactions': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { checkMedicationInteractions } from '@/lib/v2-ai';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data: medications, error } = await client
    .from('medications')
    .select('id, medicine_name, purpose, is_active, pet_id')
    .eq('is_active', true);
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  const interactions = await checkMedicationInteractions(medications || []);
  return NextResponse.json({ data: { medications, interactions } });
}''',

    'birthday': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  const year = url.searchParams.get('year');
  let query = client.from('birthday_cards').select('*, pets(name, photo_url, date_of_birth)').order('generated_at', { ascending: false });
  if (petId) query = query.eq('pet_id', petId);
  if (year) query = query.eq('year', parseInt(year));
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { pet_id, year, card_data } = await request.json();
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', (await client.auth.getUser()).data.user?.id).single();
    const { data, error } = await client.from('birthday_cards').upsert({
      pet_id, year, card_data, family_group_id: profile?.family_group_id,
    }, { onConflict: 'pet_id,year' }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}''',

    'year-review': '''import { NextResponse } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const url = new URL(request.url);
  const petId = url.searchParams.get('pet_id');
  const year = url.searchParams.get('year');
  if (!petId || !year) return NextResponse.json({ error: { message: 'pet_id and year required' } }, { status: 400 });
  const { data, error } = await client.from('pet_year_reviews').select('*, pets(name, photo_url, date_of_birth)').eq('pet_id', petId).eq('year', parseInt(year)).single();
  if (error && error.code === 'PGRST116') {
    return NextResponse.json({ data: null, message: 'No year review yet for this pet/year' });
  }
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { pet_id, year, review_data } = await request.json();
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', (await client.auth.getUser()).data.user?.id).single();
    const { data, error } = await client.from('pet_year_reviews').upsert({
      pet_id, year, review_data, family_group_id: profile?.family_group_id,
    }, { onConflict: 'pet_id,year' }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}''',

    'dental': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const dentalSchema = z.object({
  pet_id: z.string().uuid(),
  cleaning_date: z.string(),
  procedure_type: z.string().optional(),
  vet_name: z.string().optional(),
  grade: z.string().optional(),
  notes: z.string().optional(),
  next_due_date: z.string().optional(),
});

export async function GET(request: Request) {
  const { response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  const { data, error } = await client
    .from('dental_records')
    .select('*, pets(name)')
    .order('cleaning_date', { ascending: false });
  if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = dentalSchema.parse(body);
    const { data, error } = await client.from('dental_records').insert({ ...input, logged_by: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}''',

    'vet-handoff': '''import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

const handoffSchema = z.object({
  vet_visit_id: z.string().uuid(),
  estimated_return: z.string().optional(),
});

export async function POST(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const body = await request.json();
    const input = handoffSchema.parse(body);
    const { data: profile } = await client.from('profiles').select('family_group_id').eq('id', user!.id).single();
    const { data, error } = await client.from('vet_visit_handoffs').insert({ ...input, family_group_id: profile?.family_group_id, traveler_id: user!.id }).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const { user, response, supabase } = await requireUser(request);
  if (response) return response;
  const client = supabase ?? createSupabaseServerClient();
  try {
    const { id, action, update_text } = await request.json();
    const updates: Record<string, any> = {};
    if (action === 'end') updates.ended_at = new Date().toISOString();
    if (update_text) {
      // append to live_updates
      const { data: handoff } = await client.from('vet_visit_handoffs').select('live_updates').eq('id', id).single();
      const updates_list = (handoff?.live_updates as any[]) || [];
      updates.live_updates = [...updates_list, { text: update_text, at: new Date().toISOString(), by: user!.id }];
    }
    const { data, error } = await client.from('vet_visit_handoffs').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message } }, { status: 500 });
  }
}''',
}

for path, content in ROUTES.items():
    route_dir = API_DIR / path
    route_dir.mkdir(parents=True, exist_ok=True)
    route_file = route_dir / 'route.ts'
    route_file.write_text(content, encoding='utf-8')
    print(f'  ✓ Created {path}/route.ts')

print(f'\nTotal: {len(ROUTES)} API routes created')
