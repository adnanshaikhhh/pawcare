import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase public env vars');
  }

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {
          // ignore
        }
      },
    },
  });
}

/**
 * Create a Supabase client that uses a Bearer token from the Authorization
 * header (for mobile clients that don't have cookie support).
 * Falls back to a regular user-context client (RLS applies).
 */
export function createSupabaseUserClient(accessToken: string): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase public env vars');
  }
  return createSupabaseClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Extract a Bearer token from the Authorization header, if present.
 */
function extractBearer(request?: Request): string | null {
  if (!request) return null;
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token && token !== 'undefined' && token !== 'null') return token;
  }
  return null;
}

/**
 * Get a Supabase client that is correctly authenticated for the current
 * request. Prefers a Bearer token (mobile / API clients), falling back to
 * the cookie-based session (web). Always passes through the user's
 * authenticated context so RLS policies (e.g. auth.uid() IS NOT NULL) work.
 */
export function getSupabaseClient(request?: Request): SupabaseClient {
  const token = extractBearer(request);
  if (token) {
    return createSupabaseUserClient(token);
  }
  return createSupabaseServerClient();
}

/**
 * Get the current user from either cookies (web) or Authorization header (mobile).
 * Returns null if no user is authenticated.
 */
export async function getCurrentUser(request?: Request): Promise<{ user: any; supabase: SupabaseClient } | null> {
  // Try Bearer token first (for mobile/API clients)
  const token = extractBearer(request);
  if (token) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createSupabaseClient(url, key, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data, error } = await supabase.auth.getUser();
      if (!error && data.user) {
        return { user: data.user, supabase };
      }
    } catch (e) {
      // fall through to cookie auth
    }
  }
  // Fall back to cookie-based auth (web)
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return { user: data.user, supabase };
  } catch {
    return null;
  }
}

export async function requireUser(request?: Request) {
  const result = await getCurrentUser(request);
  if (!result) {
    return {
      user: null,
      supabase: null,
      response: NextResponse.json({ error: { message: 'Unauthorized' } }, { status: 401 }),
    };
  }
  return { user: result.user, supabase: result.supabase, response: null };
}
