import { createHash, randomUUID } from "node:crypto";

import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db";

type AuthEventType =
  | "AUTH_LOGIN"
  | "AUTH_REGISTER"
  | "AUTH_VERIFY_EMAIL"
  | "AUTH_PASSWORD_RESET";

export type RequestSecurityContext = {
  correlationId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export function getRequestSecurityContext(request: Request): RequestSecurityContext {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const suppliedCorrelationId = request.headers.get("x-correlation-id");
  return {
    correlationId:
      suppliedCorrelationId && /^[a-zA-Z0-9._-]{8,100}$/.test(suppliedCorrelationId)
        ? suppliedCorrelationId
        : randomUUID(),
    ipAddress: forwardedFor || request.headers.get("x-real-ip") || "unknown",
    userAgent: request.headers.get("user-agent")?.slice(0, 500) || null,
  };
}

export function hashIdentifier(identifier: string) {
  return createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex");
}

export async function enforceAuthRateLimit(input: {
  request: Request;
  type: AuthEventType;
  limit: number;
  windowMs: number;
}) {
  const context = getRequestSecurityContext(input.request);
  const since = new Date(Date.now() - input.windowMs);
  const attempts = await prisma.securityEvent.count({
    where: {
      type: input.type,
      createdAt: { gte: since },
      ipAddress: context.ipAddress,
    },
  });

  if (attempts < input.limit) return { allowed: true as const, context };

  await recordAuthEvent({ context, type: input.type, outcome: "RATE_LIMITED" });
  const retryAfter = Math.max(1, Math.ceil(input.windowMs / 1000));
  return {
    allowed: false as const,
    context,
    response: apiError(429, "RATE_LIMITED", "Too many attempts. Try again later.", {
      correlationId: context.correlationId,
      headers: { "Retry-After": String(retryAfter) },
    }),
  };
}

export async function recordAuthEvent(input: {
  context: RequestSecurityContext;
  type: AuthEventType;
  outcome: string;
  userId?: string;
  identifier?: string;
}) {
  await prisma.securityEvent.create({
    data: {
      userId: input.userId,
      type: input.type,
      outcome: input.outcome,
      correlationId: input.context.correlationId,
      ipAddress: input.context.ipAddress,
      userAgent: input.context.userAgent,
      metadata: input.identifier ? { identifierHash: hashIdentifier(input.identifier) } : undefined,
    },
  });
}
