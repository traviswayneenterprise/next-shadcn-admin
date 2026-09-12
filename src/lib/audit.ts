import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

type AuditInput = {
  actorId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  correlationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
};

export function recordAuditEvent(
  input: AuditInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return client.auditEvent.create({
    data: {
      actorId: input.actorId ?? undefined,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? undefined,
      correlationId: input.correlationId,
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
      metadata: (input.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });
}
