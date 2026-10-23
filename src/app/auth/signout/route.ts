import { NextResponse, type NextRequest } from 'next/server';
import { authEnabled, supabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  if (authEnabled()) {
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  return NextResponse.redirect(new URL('/signin', req.nextUrl.origin), { status: 303 });
}
