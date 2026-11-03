// Route guard: every page and API route requires the signed-in owner, except the sign-in
// page and the auth callback. Runs on the edge before the request reaches the app.
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC = ['/signin', '/auth/callback', '/auth/signout'];

export async function proxy(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || process.env.AUTH_DISABLED === 'true') return NextResponse.next();
  const path = req.nextUrl.pathname;
  if (PUBLIC.some(p => path.startsWith(p))) return NextResponse.next();

  let res = NextResponse.next({ request: req });
  const sb = createServerClient(url, key, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: list => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  const allowed = (process.env.OWNER_EMAIL || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const ok = !!email && (allowed.length === 0 || allowed.includes(email));
  if (ok) return res;
  if (path.startsWith('/api/')) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const to = req.nextUrl.clone();
  to.pathname = '/signin';
  to.search = email ? '?denied=1' : '';
  return NextResponse.redirect(to);
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|world/|robots.txt).*)'] };
