import { NextResponse } from 'next/server';
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
}