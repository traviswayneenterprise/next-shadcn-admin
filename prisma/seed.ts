import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { permissionCatalog } from "../src/lib/auth/permissions";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("DIRECT_URL or DATABASE_URL is required to seed.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  for (const key of permissionCatalog) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: key.replaceAll(".", " ") },
    });
  }

  const ownerRole = await prisma.role.upsert({
    where: { name: "Owner" },
    update: { isOwner: true, isSystem: true },
    create: {
      name: "Owner",
      description: "Protected product-owner role with every permission.",
      isOwner: true,
      isSystem: true,
    },
  });

  const permissions = await prisma.permission.findMany({ select: { id: true } });
  await prisma.rolePermission.createMany({
    data: permissions.map(({ id }) => ({ roleId: ownerRole.id, permissionId: id })),
    skipDuplicates: true,
  });

  const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!ownerEmail) return;

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: { email: ownerEmail, emailVerified: new Date(), name: "Product Owner" },
  });

  const existing = await prisma.roleAssignment.findFirst({
    where: { userId: owner.id, roleId: ownerRole.id, scopeType: "GLOBAL", revokedAt: null },
  });
  if (!existing) {
    await prisma.roleAssignment.create({
      data: {
        userId: owner.id,
        roleId: ownerRole.id,
        scopeType: "GLOBAL",
        assignedById: owner.id,
      },
    });
  }
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
