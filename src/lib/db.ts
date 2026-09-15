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

// Neon's serverless compute can need to wake from a suspended state, and on
// a slow/flaky client network (public Wi-Fi, degraded DNS resolvers) plain
// connection setup can itself eat several seconds before any query runs -
// the original 20s timeout got tripped by exactly this during real editor-x
// save testing, not by anything the transaction itself was doing. Use for
// any multi-statement $transaction, not just seeding.
export const TRANSACTION_OPTIONS = { maxWait: 20_000, timeout: 30_000 };
