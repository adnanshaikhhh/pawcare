// Supabase Edge Function: send-notifications
// Triggered by pg_cron every 15 minutes (or by manual invocation).
// Reads pending reminders and dispatches Expo push notifications to
// all family members who have registered a notification_token.
//
// Setup after migrations:
//   1. supabase functions deploy send-notifications --no-verify-jwt
//   2. In Supabase SQL editor, run:
//        select cron.schedule(
//          'send-pawcare-notifications', '*/15 * * * *',
//          $$ select net.http_post(
//               url:='https://<project-ref>.supabase.co/functions/v1/send-notifications',
//               headers:=jsonb_build_object('Authorization','Bearer ' || current_setting('app.cron_token'))
//             ) $$);
//   3. Set the function's env vars SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//      CRON_TOKEN (random string)
//
// Or invoke from Vercel cron: GET https://<app>/api/notifications/dispatch

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CRON_TOKEN = Deno.env.get('CRON_TOKEN') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (CRON_TOKEN) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${CRON_TOKEN}`) {
      return new Response('unauthorized', { status: 401 });
    }
  }

  const now = new Date().toISOString();
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('id, title, description, type, due_date, pet_id, family_group_id, pets(name)')
    .eq('is_completed', false)
    .eq('is_sent', false)
    .lte('reminder_at', now)
    .limit(100);

  if (error) {
    console.error('Failed to fetch reminders:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!reminders || reminders.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: { 'Content-Type': 'application/json' } });
  }

  let sent = 0;
  for (const r of reminders) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, notification_token, web_push_subscription, full_name')
      .or(
        r.family_group_id
          ? `family_group_id.eq.${r.family_group_id}`
          : `id.in.(${
              (
                await supabase
                  .from('pets')
                  .select('owner_id, family_group_id')
                  .eq('id', r.pet_id)
                  .single()
              ).data?.owner_id ?? '00000000-0000-0000-0000-000000000000'
            }${
              (
                await supabase
                  .from('pets')
                  .select('owner_id, family_group_id')
                  .eq('id', r.pet_id)
                  .single()
              ).data?.family_group_id
                ? `,${(await supabase.from('family_members').select('user_id').eq('family_group_id', (await supabase.from('pets').select('family_group_id').eq('id', r.pet_id).single()).data?.family_group_id)).data?.map((m) => m.user_id).join(',')}`
                : ''
            })`
      )
      .not('notification_token', 'is', null);

    const tokens = (profiles ?? [])
      .map((p) => p.notification_token)
      .filter((t): t is string => !!t && t.startsWith('ExponentPushToken['));

    if (tokens.length === 0) {
      await supabase.from('reminders').update({ is_sent: true }).eq('id', r.id);
      continue;
    }

    const messages = tokens.map((to) => ({
      to,
      sound: 'default',
      title: r.title,
      body: r.description ?? 'You have a PawCare reminder',
      data: { reminder_id: r.id, type: r.type, pet_id: r.pet_id },
    }));

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(messages),
      });
      if (res.ok) sent += tokens.length;
    } catch (err) {
      console.error('Expo push failed', err);
    }

    await supabase.from('reminders').update({ is_sent: true }).eq('id', r.id);
  }

  return new Response(JSON.stringify({ sent, processed: reminders.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
