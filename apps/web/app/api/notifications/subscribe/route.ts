import { NextResponse } from 'next/server';
import { notificationSubscribeSchema } from '@/lib/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';

export async function POST(req: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(req);
  if (response) return response;
  try {
    const body = await req.json();
    const input = notificationSubscribeSchema.parse(body);
    const supabase = userSupabase ?? createSupabaseServerClient();
    const updates: Record<string, unknown> = {};
    if (input.expo_push_token) updates.notification_token = input.expo_push_token;
    if (input.web_push_subscription) updates.web_push_subscription = input.web_push_subscription;
    const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });
    return NextResponse.json({ data: { saved: true } });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
