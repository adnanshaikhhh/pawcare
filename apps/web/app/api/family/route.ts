import { NextResponse } from 'next/server';
import { familyCreateSchema, familyJoinSchema } from '@/lib/shared';
import { createSupabaseServerClient, requireUser } from '@/lib/supabase-server';
import { handleZodError } from '@/lib/route-helpers';
import { generateFamilyCode } from '@/lib/shared';

export async function GET(request: Request) {
  const { user, response, supabase: userSupabase } = await requireUser(request);
  if (response) return response;
  const supabase = userSupabase ?? createSupabaseServerClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile?.family_group_id) {
    return NextResponse.json({ data: null });
  }
  const { data: group } = await supabase
    .from('family_groups')
    .select('*')
    .eq('id', profile.family_group_id)
    .single();
  const { data: members } = await supabase
    .from('family_members')
    .select('*, profiles(full_name, avatar_url, email)')
    .eq('family_group_id', profile.family_group_id);
  return NextResponse.json({ data: { group, members, my_role: profile.family_role } });
}

export async function POST(req: Request) {
  // Create a new family group
  const { user, response, supabase: userSupabase } = await requireUser(req);
  if (response) return response;
  try {
    const body = await req.json();
    const input = familyCreateSchema.parse(body);
    const supabase = userSupabase ?? createSupabaseServerClient();
    const { data, error } = await supabase
      .from('family_groups')
      .insert({ name: input.name, owner_id: user.id, invite_code: generateFamilyCode() })
      .select()
      .single();
    if (error) return NextResponse.json({ error: { message: error.message } }, { status: 500 });

    await supabase
      .from('profiles')
      .update({ family_group_id: data.id, family_role: 'owner' })
      .eq('id', user.id);

    await supabase.from('family_members').insert({
      family_group_id: data.id,
      user_id: user.id,
      role: 'owner',
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  // Join with invite code
  const { user, response, supabase: userSupabase } = await requireUser(req);
  if (response) return response;
  try {
    const body = await req.json();
    const input = familyJoinSchema.parse(body);
    const supabase = userSupabase ?? createSupabaseServerClient();

    const { data: group, error: groupErr } = await supabase
      .from('family_groups')
      .select('*')
      .eq('invite_code', input.invite_code.toUpperCase())
      .single();
    if (groupErr || !group) {
      return NextResponse.json({ error: { message: 'Invalid invite code' } }, { status: 404 });
    }

    await supabase
      .from('profiles')
      .update({ family_group_id: group.id, family_role: 'caregiver' })
      .eq('id', user.id);

    await supabase.from('family_members').upsert(
      { family_group_id: group.id, user_id: user.id, role: 'caregiver' },
      { onConflict: 'family_group_id,user_id' }
    );

    return NextResponse.json({ data: { joined: true, group } });
  } catch (err) {
    return NextResponse.json({ error: handleZodError(err) }, { status: 400 });
  }
}
