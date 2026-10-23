import { NextResponse } from 'next/server';
import { currentOwner } from '@/lib/supabase/server';

/** Returns a 401 response when the request is not from the signed-in owner, else null. */
export async function guard(): Promise<NextResponse | null> {
  const who = await currentOwner();
  return who ? null : NextResponse.json({ error: 'Sign in required' }, { status: 401 });
}
