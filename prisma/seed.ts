import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { permissionCatalog } from "../src/lib/auth/permissions";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required to seed.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  await prisma.$transaction(
    async (transaction) => {
      // Prevent two deploys from racing the otherwise-idempotent bootstrap.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(${2026081801})`;

      for (const key of permissionCatalog) {
        const description = key.replaceAll(".", " ");
        await transaction.permission.upsert({
          where: { key },
          update: { description },
          create: { key, description },
        });
      }

      const ownerRoleDescription = "Protected product-owner role with every permission.";
      const existingOwnerRole = await transaction.role.findUnique({ where: { name: "Owner" } });
      const ownerRole = !existingOwnerRole
        ? await transaction.role.create({
            data: {
              name: "Owner",
              description: ownerRoleDescription,
              isOwner: true,
              isSystem: true,
            },
          })
        : existingOwnerRole.description !== ownerRoleDescription ||
            !existingOwnerRole.isOwner ||
            !existingOwnerRole.isSystem
          ? await transaction.role.update({
              where: { id: existingOwnerRole.id },
              data: {
                description: ownerRoleDescription,
                isOwner: true,
                isSystem: true,
              },
            })
          : existingOwnerRole;

      const permissions = await transaction.permission.findMany({ select: { id: true } });
      await transaction.rolePermission.createMany({
        data: permissions.map(({ id }) => ({ roleId: ownerRole.id, permissionId: id })),
        skipDuplicates: true,
      });

      const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
      if (!ownerEmail) return;

      const existingOwner = await transaction.user.findUnique({ where: { email: ownerEmail } });
      const owner = !existingOwner
        ? await transaction.user.create({
            data: { email: ownerEmail, emailVerified: new Date(), name: "Product Owner" },
          })
        : !existingOwner.emailVerified || existingOwner.status !== "ACTIVE"
          ? await transaction.user.update({
              where: { id: existingOwner.id },
              data: {
                ...(!existingOwner.emailVerified ? { emailVerified: new Date() } : {}),
                ...(existingOwner.status !== "ACTIVE" ? { status: "ACTIVE" as const } : {}),
              },
            })
          : existingOwner;

      const existing = await transaction.roleAssignment.findFirst({
        where: { userId: owner.id, roleId: ownerRole.id, scopeType: "GLOBAL", revokedAt: null },
        select: { id: true },
      });
      if (!existing) {
        await transaction.roleAssignment.create({
          data: {
            userId: owner.id,
            roleId: ownerRole.id,
            scopeType: "GLOBAL",
            assignedById: owner.id,
          },
        });
      }
    },
    {
      // Neon may need to wake a suspended compute before beginning a transaction.
      maxWait: 15_000,
      timeout: 60_000,
    },
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
