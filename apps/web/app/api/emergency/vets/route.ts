import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { findNearbyVets } from '@/lib/places';
import { getClientIp, rateLimit } from '@/lib/route-helpers';

export async function GET(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const ip = getClientIp(request);
  const rl = rateLimit(`emergency:${ip}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ error: { message: 'Rate limit exceeded' } }, { status: 429 });
  }

  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  const radius = Number(url.searchParams.get('radius') ?? 10);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: { message: 'lat and lon required' } }, { status: 400 });
  }

  const vets = await findNearbyVets(lat, lon, radius);
  return NextResponse.json({ data: vets });
}
