import { PrismaClient } from '@prisma/client';
import { prismaUrl } from './dburl';

const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient({ datasourceUrl: prismaUrl(process.env.DATABASE_URL) });
if (process.env.NODE_ENV !== 'production') g.prisma = prisma;
