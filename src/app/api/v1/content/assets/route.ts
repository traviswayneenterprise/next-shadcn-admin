import { apiError, apiSuccess } from "@/lib/api/response";
import { authorize } from "@/lib/auth/authorize";
import { assetPublicUrl, AssetUploadError, uploadAsset } from "@/domain/content/assets";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const assets = await prisma.asset.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return apiSuccess(assets.map((asset) => ({ ...asset, url: assetPublicUrl(asset.key) })));
}

export async function POST(request: Request) {
  const auth = await authorize("content.edit");
  if (auth.response) return auth.response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!form || !(file instanceof File)) return apiError(400, "BAD_REQUEST", "A file field is required.");

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const asset = await uploadAsset({
      uploadedById: auth.actor.id,
      originalName: file.name,
      contentType: file.type || "application/octet-stream",
      bytes,
    });
    return apiSuccess({ ...asset, url: assetPublicUrl(asset.key) }, { status: 201 });
  } catch (error) {
    if (error instanceof AssetUploadError) return apiError(400, "BAD_REQUEST", error.message);
    throw error;
  }
}
