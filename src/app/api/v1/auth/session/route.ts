import { cookies } from "next/headers";

import { getCurrentSession } from "@/lib/auth/current-session";
import { apiSuccess } from "@/lib/api/response";
import { csrfCookieName, csrfCookieOptions, sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { generateCsrfToken } from "@/lib/auth/csrf";
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
    response.cookies.set(csrfCookieName, "", {
      ...csrfCookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
    return response;
  }

  const permissions = await getGlobalPermissions(session.userId);

  const response = apiSuccess({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      permissions,
    },
    expiresAt: session.expires.toISOString(),
  });

  // Auth.js OAuth sign-in sets the session cookie directly, bypassing the
  // password-login route where the CSRF cookie is normally issued. Backfill
  // it here so every authenticated session ends up with one.
  const cookieStore = await cookies();
  if (!cookieStore.get(csrfCookieName)?.value) {
    response.cookies.set(csrfCookieName, generateCsrfToken(), {
      ...csrfCookieOptions,
      expires: session.expires,
    });
  }

  return response;
}
