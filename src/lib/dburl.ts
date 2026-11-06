/**
 * Prepares the database address for Prisma. Supabase's transaction pooler (port 6543) runs every
 * query on whichever connection is free, so Prisma must be told it is behind PgBouncer: otherwise
 * its cached ("prepared") statements vanish between queries and reads fail with
 * `prepared statement "s1" does not exist`. Supabase's displayed address leaves the switch out,
 * so it is added here. One connection per serverless instance is what Prisma recommends for a pooler.
 */
export function prismaUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  // A pasted value often carries a trailing space or newline; left in, it would end up in the database name.
  const clean = raw.trim();
  const pooled = /:6543(\/|\?|$)/.test(clean) || /pooler\.supabase\.com:6543/.test(clean);
  if (!pooled) return clean;
  let u = clean;
  const add = (k: string, v: string) => { if (!new RegExp(`[?&]${k}=`).test(u)) u += (u.includes('?') ? '&' : '?') + `${k}=${v}`; };
  add('pgbouncer', 'true');
  add('connection_limit', '1');
  return u;
}
