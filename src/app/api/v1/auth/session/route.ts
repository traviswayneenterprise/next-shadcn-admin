import { getCurrentSession } from "@/lib/auth/current-session";
import { apiSuccess } from "@/lib/api/response";
import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { getGlobalPermissions } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    const response = apiSuccess(null);
    response.cookies.set(sessionCookieName, "", {
      ...sessionCookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  const permissions = await getGlobalPermissions(session.userId);

  return apiSuccess({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      permissions,
    },
    expiresAt: session.expires.toISOString(),
  });
}
