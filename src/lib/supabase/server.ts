import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const authEnabled = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.AUTH_DISABLED !== 'true';

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: list => { try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* read-only in server components */ } },
    },
  });
}

export const ownerEmails = () => (process.env.OWNER_EMAIL || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

/** Email of the signed-in owner, or null when the visitor is not the owner. */
export async function currentOwner(): Promise<string | null> {
  if (!authEnabled()) return 'local';
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  const email = data.user?.email?.toLowerCase();
  if (!email) return null;
  const allowed = ownerEmails();
  return allowed.length === 0 || allowed.includes(email) ? email : null;
}
