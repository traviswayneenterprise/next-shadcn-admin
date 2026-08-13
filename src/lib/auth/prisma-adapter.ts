import type { Adapter } from "next-auth/adapters";

import type { PrismaClient } from "@/generated/prisma/client";

export function prismaAuthAdapter(prisma: PrismaClient): Adapter {
  return {
    async createUser(data) {
      const user = await prisma.user.create({ data });
      return { ...user, emailVerified: user.emailVerified };
    },
    async getUser(id) {
      return prisma.user.findUnique({ where: { id } });
    },
    async getUserByEmail(email) {
      return prisma.user.findUnique({ where: { email } });
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return account?.user ?? null;
    },
    async updateUser({ id, ...data }) {
      return prisma.user.update({ where: { id }, data });
    },
    async deleteUser(id) {
      return prisma.user.delete({ where: { id } });
    },
    async linkAccount(data) {
      await prisma.account.create({ data: { ...data, userId: data.userId } });
    },
    async unlinkAccount({ provider, providerAccountId }) {
      await prisma.account.delete({ where: { provider_providerAccountId: { provider, providerAccountId } } });
    },
    async createSession(data) {
      return prisma.session.create({ data });
    },
    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({ where: { sessionToken }, include: { user: true } });
      return session ? { session, user: session.user } : null;
    },
    async updateSession({ sessionToken, ...data }) {
      return prisma.session.update({ where: { sessionToken }, data });
    },
    async deleteSession(sessionToken) {
      return prisma.session.delete({ where: { sessionToken } });
    },
    async createVerificationToken({ identifier, token, expires }) {
      const result = await prisma.verificationToken.create({
        data: { identifier, tokenHash: token, expires },
      });
      return { identifier: result.identifier, token, expires: result.expires };
    },
    async useVerificationToken({ identifier, token }) {
      const record = await prisma.verificationToken.findUnique({ where: { tokenHash: token } });
      if (!record || record.identifier !== identifier) return null;
      await prisma.verificationToken.delete({ where: { tokenHash: token } });
      return { identifier: record.identifier, token, expires: record.expires };
    },
  };
}
