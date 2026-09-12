import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { env, requireEnvironment } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  requireEnvironment("DATABASE_URL");
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Neon's serverless compute can need to wake from a suspended state; the
// default 5s interactive-transaction timeout is routinely too tight for
// that cold start. Use for any multi-statement $transaction, not just seeding.
export const TRANSACTION_OPTIONS = { maxWait: 15_000, timeout: 20_000 };
