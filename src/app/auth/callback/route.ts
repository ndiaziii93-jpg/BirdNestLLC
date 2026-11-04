import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Google sends the browser here (via Supabase) with a one-time code. Exchanging it stores the
 * session cookies; any failure is shown on the sign-in page instead of silently bouncing.
 */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') || '/';
  const providerError = req.nextUrl.searchParams.get('error_description') || req.nextUrl.searchParams.get('error');
  const fail = (msg: string) => NextResponse.redirect(new URL('/signin?error=' + encodeURIComponent(msg), req.nextUrl.origin));
  if (providerError) return fail(providerError);
  if (!code) return fail('No sign-in code was returned. Check the Supabase redirect URLs.');
  const sb = await supabaseServer();
  const { error } = await sb.auth.exchangeCodeForSession(code);
  if (error) return fail(error.message);
  return NextResponse.redirect(new URL(next, req.nextUrl.origin));
}
