import { NextResponse } from 'next/server';
import { currentOwner } from '@/lib/supabase/server';

/** Returns a 401 response when the request is not from the signed-in owner, else null. */
export async function guard(): Promise<NextResponse | null> {
  const who = await currentOwner();
  return who ? null : NextResponse.json({ error: 'Sign in required' }, { status: 401 });
}

/** A short, readable reason for a failure: Prisma messages carry the cause on their last line. */
export function reason(e: unknown): string {
  const code = e && typeof e === 'object' && 'code' in e ? String((e as { code: unknown }).code) + ': ' : '';
  const msg = e instanceof Error ? e.message : String(e);
  const last = msg.split('\n').map(l => l.trim()).filter(Boolean).pop() || 'Unknown error';
  return (code + last).slice(0, 400);
}

/** Wraps a route handler so an unexpected failure comes back as JSON with its reason, and is logged. */
export function handle<A extends unknown[]>(fn: (...a: A) => Promise<Response>) {
  return async (...a: A): Promise<Response> => {
    try { return await fn(...a); }
    catch (e) { console.error(e); return NextResponse.json({ error: reason(e) }, { status: 500 }); }
  };
}
