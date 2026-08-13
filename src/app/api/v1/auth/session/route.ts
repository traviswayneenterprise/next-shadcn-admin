import { getCurrentSession } from "@/lib/auth/current-session";
import { apiSuccess } from "@/lib/api/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) return apiSuccess(null);

  return apiSuccess({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      permissions: [],
    },
    expiresAt: session.expires.toISOString(),
  });
}
