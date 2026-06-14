import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function authCheck(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'pawcare_cron_secret_2025';
  if (authHeader === `Bearer ${cronSecret}`) return true;
  const ua = request.headers.get('user-agent') || '';
  if (ua.includes('vercel-cron') || request.headers.get('x-vercel-cron')) return true;
  return false;
}

export async function GET(request: NextRequest) {
  if (!await authCheck(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const t0 = Date.now();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const in7days = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  const in3days = new Date(now.getTime() + 3 * 86400000).toISOString().slice(0, 10);

  const stats: Record<string, number> = {
    vaccines_added: 0,
    deworming_added: 0,
    heat_added: 0,
    inventory_added: 0,
    birthdays_added: 0,
    reminders_collected: 0,
    notifications_queued: 0,
    sent_count: 0,
  };

  try {
    // PHASE 1: Auto-create reminders

    // 1a. Vaccinations
    const { data: dueVax, error: e1 } = await supabase
      .from('vaccinations')
      .select('id, pet_id, vaccine_name, next_due_date')
      .not('next_due_date', 'is', null)
      .lte('next_due_date', in7days)
      .gte('next_due_date', today);
    if (e1) throw e1;

    const petMap = new Map<string, string>();
    for (const v of dueVax ?? []) {
      if (!petMap.has(v.pet_id)) {
        const { data: p } = await supabase.from('pets').select('name').eq('id', v.pet_id).single();
        if (p) petMap.set(v.pet_id, p.name);
      }
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('pet_id', v.pet_id)
        .eq('type', 'vaccine')
        .eq('is_completed', false)
        .ilike('title', '%' + v.vaccine_name + '%')
        .limit(1);
      if (existing && existing.length > 0) continue;
      const petName = petMap.get(v.pet_id) ?? 'Pet';
      const dueDate = new Date(v.next_due_date!);
      const reminderAt = new Date(dueDate.getTime() - 7 * 86400000);
      const { error: insErr } = await supabase.from('reminders').insert({
        pet_id: v.pet_id, type: 'vaccine',
        title: petName + ' — ' + v.vaccine_name + ' due',
        description: 'Vaccination ' + v.vaccine_name + ' is due on ' + v.next_due_date,
        due_date: dueDate.toISOString(),
        reminder_at: reminderAt.toISOString(),
      });
      if (!insErr) stats.vaccines_added++;
    }

    // 1b. Deworming
    const { data: dueDew, error: e2 } = await supabase
      .from('deworming_records')
      .select('id, pet_id, product_name, next_due_date')
      .not('next_due_date', 'is', null)
      .lte('next_due_date', in3days)
      .gte('next_due_date', today);
    if (e2) throw e2;

    for (const d of dueDew ?? []) {
      if (!petMap.has(d.pet_id)) {
        const { data: p } = await supabase.from('pets').select('name').eq('id', d.pet_id).single();
        if (p) petMap.set(d.pet_id, p.name);
      }
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('pet_id', d.pet_id)
        .eq('type', 'deworming')
        .eq('is_completed', false)
        .ilike('title', '%' + d.product_name + '%')
        .limit(1);
      if (existing && existing.length > 0) continue;
      const petName = petMap.get(d.pet_id) ?? 'Pet';
      const dueDate = new Date(d.next_due_date!);
      const reminderAt = new Date(dueDate.getTime() - 3 * 86400000);
      const { error: insErr } = await supabase.from('reminders').insert({
        pet_id: d.pet_id, type: 'deworming',
        title: petName + ' — deworming due',
        description: 'Deworming with ' + d.product_name + ' is due on ' + d.next_due_date,
        due_date: dueDate.toISOString(),
        reminder_at: reminderAt.toISOString(),
      });
      if (!insErr) stats.deworming_added++;
    }

    // 1c. Heat cycles
    const { data: dueHeat, error: e3 } = await supabase
      .from('heat_cycles')
      .select('id, pet_id, predicted_next')
      .not('predicted_next', 'is', null)
      .lte('predicted_next', in3days)
      .gte('predicted_next', today);
    if (e3) throw e3;

    for (const h of dueHeat ?? []) {
      if (!petMap.has(h.pet_id)) {
        const { data: p } = await supabase.from('pets').select('name').eq('id', h.pet_id).single();
        if (p) petMap.set(h.pet_id, p.name);
      }
      const petName = petMap.get(h.pet_id) ?? 'Pet';
      const dueDate = new Date(h.predicted_next!);
      const reminderAt = new Date(dueDate.getTime() - 3 * 86400000);
      const { error: insErr } = await supabase.from('reminders').insert({
        pet_id: h.pet_id, type: 'heat',
        title: petName + ' — heat cycle predicted',
        description: 'Predicted next heat cycle for ' + petName,
        due_date: dueDate.toISOString(),
        reminder_at: reminderAt.toISOString(),
      });
      if (!insErr) stats.heat_added++;
    }

    // 1d. Inventory
    const { data: lowStock, error: e4 } = await supabase
      .from('inventory_items')
      .select('id, item_name, alert_days_before, estimated_days_remaining')
      .eq('is_active', true)
      .eq('alert_enabled', true)
      .not('estimated_days_remaining', 'is', null);
    if (e4) throw e4;

    for (const i of lowStock ?? []) {
      if ((i.estimated_days_remaining ?? 999) > (i.alert_days_before ?? 2)) continue;
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('type', 'inventory')
        .eq('is_completed', false)
        .ilike('title', i.item_name + '%')
        .limit(1);
      if (existing && existing.length > 0) continue;
      const { error: insErr } = await supabase.from('reminders').insert({
        type: 'inventory',
        title: i.item_name + ' running low',
        description: 'Only ' + i.estimated_days_remaining + ' day(s) of stock left',
        due_date: new Date(now.getTime() + 86400000).toISOString(),
        reminder_at: now.toISOString(),
      });
      if (!insErr) stats.inventory_added++;
    }

    // 1e. Birthdays
    const { data: pets, error: e5 } = await supabase
      .from('pets')
      .select('id, name, date_of_birth')
      .eq('is_active', true)
      .not('date_of_birth', 'is', null);
    if (e5) throw e5;

    for (const p of pets ?? []) {
      if (!p.date_of_birth) continue;
      const dob = new Date(p.date_of_birth);
      const thisYearBday = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      if (thisYearBday < now) thisYearBday.setFullYear(now.getFullYear() + 1);
      const diffDays = Math.floor((thisYearBday.getTime() - now.getTime()) / 86400000);
      if (diffDays < 0 || diffDays > 7) continue;
      const { data: existing } = await supabase
        .from('reminders')
        .select('id')
        .eq('pet_id', p.id)
        .eq('type', 'birthday')
        .eq('is_completed', false);
      if (existing && existing.length > 0) continue;
      const { error: insErr } = await supabase.from('reminders').insert({
        pet_id: p.id, type: 'birthday',
        title: p.name + "'s birthday coming up!",
        description: p.name + ' turns ' + (now.getFullYear() - dob.getFullYear()) + ' on ' + thisYearBday.toISOString().slice(0, 10),
        due_date: thisYearBday.toISOString(),
        reminder_at: new Date(thisYearBday.getTime() - 7 * 86400000).toISOString(),
      });
      if (!insErr) stats.birthdays_added++;
    }

    // PHASE 2: Collect due reminders
    const { data: reminders, error: remErr } = await supabase
      .from('reminders')
      .select('id, title, description, type, due_date, pet_id, created_by, family_group_id')
      .lte('reminder_at', now.toISOString())
      .eq('is_sent', false)
      .eq('is_completed', false)
      .limit(100);
    if (remErr) throw remErr;
    stats.reminders_collected = reminders?.length ?? 0;

    if (reminders && reminders.length > 0) {
      const userIds = new Set<string>();
      for (const r of reminders) if (r.created_by) userIds.add(r.created_by);

      let profileTokens: Array<{ id: string; notification_token: string | null; family_group_id: string | null }> = [];
      if (userIds.size > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, notification_token, family_group_id')
          .in('id', Array.from(userIds));
        profileTokens = profs ?? [];
      }

      const familyIds = profileTokens.map((p) => p.family_group_id).filter(Boolean) as string[];
      if (familyIds.length > 0) {
        const { data: members } = await supabase
          .from('profiles')
          .select('id, notification_token, family_group_id')
          .in('family_group_id', familyIds)
          .not('notification_token', 'is', null);
        for (const m of members ?? []) {
          if (!profileTokens.find((p) => p.id === m.id)) profileTokens.push(m);
        }
      }

      const messages: Array<{ to: string; sound: string; title: string; body: string; data: Record<string, unknown> }> = [];
      for (const reminder of reminders) {
        const petName = reminder.pet_id ? petMap.get(reminder.pet_id) ?? '' : '';
        for (const profile of profileTokens) {
          if (!profile.notification_token) continue;
          messages.push({
            to: profile.notification_token,
            sound: 'default',
            title: reminder.title,
            body: reminder.description ?? (petName ? petName + ': ' + reminder.title : reminder.title),
            data: { reminder_id: reminder.id, pet_id: reminder.pet_id, type: reminder.type },
          });
        }
      }
      stats.notifications_queued = messages.length;

      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i += 100) {
          const chunk = messages.slice(i, i + 100);
          try {
            const res = await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify(chunk),
            });
            if (res.ok) stats.sent_count += chunk.length;
          } catch (err) {
            console.error('Expo push failed:', err);
          }
        }
      }

      await supabase.from('reminders').update({ is_sent: true }).in('id', reminders.map((r) => r.id));
    }

    return NextResponse.json({ success: true, duration_ms: Date.now() - t0, ...stats });
  } catch (err) {
    let errStr: string;
    let errObj: unknown = null;
    try {
      if (err && typeof err === 'object') {
        errStr = JSON.stringify(err);
        errObj = err;
      } else {
        errStr = String(err);
      }
    } catch {
      errStr = 'unstringifiable error';
    }
    console.error('CRON_FULL_ERROR', errStr);
    return NextResponse.json({ error: errStr, error_detail: errObj, ...stats }, { status: 500 });
  }
}
