import { z, ZodError } from "zod";

import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { createReusableBlock } from "@/domain/content/reusable-blocks";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const inputSchema = z.object({ name: z.string().min(1).max(200), blocks: z.array(z.unknown()).max(200) });

export async function GET() {
  const auth = await authorize("content.read");
  if (auth.response) return auth.response;

  const blocks = await prisma.reusableBlock.findMany({ orderBy: { updatedAt: "desc" }, take: 100 });
  return apiSuccess(blocks);
}

export async function POST(request: Request) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "BAD_REQUEST", "A name and blocks array are required.");

  try {
    const reusableBlock = await createReusableBlock({ name: parsed.data.name, actorId: auth.actor.id, blocks: parsed.data.blocks });
    return apiSuccess(reusableBlock, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return apiError(400, "BAD_REQUEST", "One or more blocks failed validation.", { details: { issues: error.issues } });
    }
    throw error;
  }
}
