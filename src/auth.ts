import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { sessionCookieName, sessionCookieOptions } from "@/lib/auth/cookie";
import { prismaAuthAdapter } from "@/lib/auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const { handlers, auth } = NextAuth({
  adapter: prismaAuthAdapter(prisma),
  session: { strategy: "database" },
  providers:
    env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
      ? [Google({ clientId: env.AUTH_GOOGLE_ID, clientSecret: env.AUTH_GOOGLE_SECRET })]
      : [],
  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: sessionCookieOptions,
    },
  },
  pages: {
    signIn: `${env.LEARNER_ORIGIN}/login`,
    error: `${env.LEARNER_ORIGIN}/login`,
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
