import { NextResponse, type NextRequest } from 'next/server';
import { authEnabled, supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Starts Google sign-in from the server (Supabase's recommended SSR pattern): the PKCE verifier is
 * written to a cookie here and read back by /auth/callback, so nothing depends on browser-side state.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  if (!authEnabled()) return NextResponse.redirect(new URL('/', origin));
  const sb = await supabaseServer();
  if (req.nextUrl.searchParams.get('switch') === '1') await sb.auth.signOut();
  const { data, error } = await sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback`, skipBrowserRedirect: true },
  });
  if (error || !data.url) return NextResponse.redirect(new URL('/signin?error=' + encodeURIComponent(error?.message || 'Could not start Google sign-in'), origin));
  return NextResponse.redirect(data.url);
}
