import { apiSuccess } from "@/lib/api/response";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return apiSuccess({
    status: "ok" as const,
    service: "backend-admin" as const,
    version: env.APP_VERSION,
  });
}
