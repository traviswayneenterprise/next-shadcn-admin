import type { operations, paths } from "./schema.js";

export type { components, operations, paths } from "./schema.js";

export const LMS_API_VERSION = "1.0.0" as const;
export const LMS_API_BASE_PATH = "/api/v1" as const;

export type OperationId = keyof operations;
export type OperationRequestBody<T extends OperationId> =
  operations[T] extends {
    requestBody: { content: { "application/json": infer TBody } };
  }
    ? TBody
    : never;

export type ApiPath = keyof paths;

export interface LmsApiClientOptions {
  baseUrl: string;
  fetch?: typeof globalThis.fetch;
}

export interface LmsApiRequestOptions extends RequestInit {
  correlationId?: string;
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
  meta?: { correlationId?: string };
}

function isSuccessEnvelope<TResponse>(
  body: ({ data: TResponse } & ErrorEnvelope) | ErrorEnvelope | null,
): body is { data: TResponse } & ErrorEnvelope {
  return body !== null && "data" in body && !("error" in body && body.error);
}

export class LmsApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly correlationId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "LmsApiError";
  }
}

export function createLmsApiClient(options: LmsApiClientOptions) {
  const requestFetch = options.fetch ?? globalThis.fetch;
  const baseUrl = options.baseUrl.replace(/\/$/, "");

  return {
    async request<TResponse>(
      path: ApiPath | (string & {}),
      request: LmsApiRequestOptions = {},
    ): Promise<TResponse> {
      const response = await requestFetch(`${baseUrl}${path}`, {
        ...request,
        credentials: request.credentials ?? "include",
        headers: {
          Accept: "application/json",
          ...(request.body ? { "Content-Type": "application/json" } : {}),
          ...(request.correlationId ? { "X-Correlation-ID": request.correlationId } : {}),
          ...request.headers,
        },
      });

      const body = (await response.json().catch(() => null)) as
        | ({ data: TResponse } & ErrorEnvelope)
        | ErrorEnvelope
        | null;

      if (!response.ok || !isSuccessEnvelope(body)) {
        throw new LmsApiError(
          response.status,
          body?.error?.code ?? "INTERNAL_ERROR",
          body?.error?.message ?? "The LMS API request failed.",
          body?.meta?.correlationId,
          body?.error?.details,
        );
      }

      return body.data;
    },
  };
}
