import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

function metadata(correlationId?: string) {
  return {
    correlationId: correlationId ?? randomUUID(),
    timestamp: new Date().toISOString(),
  };
}

export function apiSuccess<T>(data: T, init?: ResponseInit & { correlationId?: string }) {
  const { correlationId, ...responseInit } = init ?? {};
  return NextResponse.json(
    { data, meta: metadata(correlationId) },
    responseInit,
  );
}

export function apiSuccessPage<T>(
  data: T,
  page: { nextCursor: string | null; hasMore: boolean },
  init?: ResponseInit & { correlationId?: string },
) {
  const { correlationId, ...responseInit } = init ?? {};
  return NextResponse.json(
    { data, page, meta: metadata(correlationId) },
    responseInit,
  );
}

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  options?: {
    correlationId?: string;
    details?: Record<string, unknown>;
    headers?: HeadersInit;
  },
) {
  return NextResponse.json(
    {
      error: { code, message, details: options?.details },
      meta: metadata(options?.correlationId),
    },
    { status, headers: options?.headers },
  );
}
