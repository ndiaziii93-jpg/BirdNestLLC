import { describe, expect, it } from 'vitest';
import { prismaUrl } from '@/lib/dburl';

describe('database address for Prisma', () => {
  const pooler = 'postgresql://postgres.abc:pw@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
  it('adds the PgBouncer switch and one connection to Supabase transaction-pooler addresses', () => {
    expect(prismaUrl(pooler)).toBe(pooler + '?pgbouncer=true&connection_limit=1');
  });
  it('keeps settings that are already there', () => {
    expect(prismaUrl(pooler + '?pgbouncer=true')).toBe(pooler + '?pgbouncer=true&connection_limit=1');
    expect(prismaUrl(pooler + '?pgbouncer=true&connection_limit=3')).toBe(pooler + '?pgbouncer=true&connection_limit=3');
  });
  it('drops spaces and line breaks pasted around the address', () => {
    expect(prismaUrl(pooler + ' ')).toBe(pooler + '?pgbouncer=true&connection_limit=1');
    expect(prismaUrl('  ' + pooler + '\n')).toBe(pooler + '?pgbouncer=true&connection_limit=1');
    expect(prismaUrl('postgresql://postgres:postgres@localhost:5432/birdnest ')).toBe('postgresql://postgres:postgres@localhost:5432/birdnest');
  });
  it('leaves direct and session connections alone', () => {
    const direct = 'postgresql://postgres.abc:pw@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
    expect(prismaUrl(direct)).toBe(direct);
    expect(prismaUrl('postgresql://postgres:postgres@localhost:5432/birdnest')).toBe('postgresql://postgres:postgres@localhost:5432/birdnest');
    expect(prismaUrl(undefined)).toBeUndefined();
  });
});
