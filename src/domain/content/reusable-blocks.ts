import { randomUUID } from "node:crypto";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";
import { leafBlockSchema } from "@/domain/content/blocks";
import { prisma, TRANSACTION_OPTIONS } from "@/lib/db";

export class ReusableBlockError extends Error {}

const leafBlocksInput = z.array(leafBlockSchema).max(200);

export async function createReusableBlock(input: { name: string; actorId: string; blocks: unknown }) {
  const blocks = leafBlocksInput.parse(input.blocks);
  return prisma.$transaction(async (transaction) => {
    const document = await transaction.contentDocument.create({
      data: { schemaVersion: 1, blocks: blocks as Prisma.InputJsonValue },
    });
    return transaction.reusableBlock.create({
      data: { name: input.name, documentId: document.id, createdById: input.actorId },
    });
  }, TRANSACTION_OPTIONS);
}

export async function updateReusableBlock(input: { reusableBlockId: string; blocks: unknown }) {
  const blocks = leafBlocksInput.parse(input.blocks);
  return prisma.$transaction(async (transaction) => {
    const existing = await transaction.reusableBlock.findUnique({ where: { id: input.reusableBlockId } });
    if (!existing) throw new ReusableBlockError("Reusable block not found.");

    await transaction.contentDocument.update({
      where: { id: existing.documentId },
      data: { blocks: blocks as Prisma.InputJsonValue },
    });
    // Every edit bumps the version, published or not: existing lesson
    // snapshots already captured the prior version's blocks and are
    // unaffected (they are frozen copies, never a live reference).
    return transaction.reusableBlock.update({
      where: { id: existing.id },
      data: { version: { increment: 1 } },
    });
  }, TRANSACTION_OPTIONS);
}

/** Produces a ready-to-insert `reusableSnapshot` block for the editor to drop into a draft document. */
export async function resolveReusableBlockSnapshot(reusableBlockId: string) {
  const reusableBlock = await prisma.reusableBlock.findUnique({
    where: { id: reusableBlockId },
    include: { document: true },
  });
  if (!reusableBlock) throw new ReusableBlockError("Reusable block not found.");

  const blocks = leafBlocksInput.parse(reusableBlock.document.blocks);
  return {
    id: randomUUID(),
    version: 1 as const,
    type: "reusableSnapshot" as const,
    data: { sourceId: reusableBlock.id, sourceVersion: reusableBlock.version, blocks },
  };
}
