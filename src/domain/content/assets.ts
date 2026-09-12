import { randomUUID } from "node:crypto";

import { prisma } from "@/lib/db";
import { putObject, publicAssetUrl } from "@/lib/storage/r2";

const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
const LAB_TYPES = new Set(["text/html", "text/css", "application/javascript", "text/javascript"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_LAB_BYTES = 25 * 1024 * 1024;

export class AssetUploadError extends Error {}

function sanitizeFilename(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-150) || "file";
}

export async function uploadAsset(input: {
  uploadedById: string;
  originalName: string;
  contentType: string;
  bytes: Buffer;
}) {
  const isImage = IMAGE_TYPES.has(input.contentType);
  const isLab = LAB_TYPES.has(input.contentType);
  if (!isImage && !isLab) {
    throw new AssetUploadError(`Unsupported content type: ${input.contentType}`);
  }
  const limit = isImage ? MAX_IMAGE_BYTES : MAX_LAB_BYTES;
  if (input.bytes.byteLength > limit) {
    throw new AssetUploadError(`File exceeds the ${limit / (1024 * 1024)}MB limit for this content type.`);
  }
  if (input.bytes.byteLength === 0) {
    throw new AssetUploadError("File is empty.");
  }

  const assetId = randomUUID();
  const filename = sanitizeFilename(input.originalName);
  const key = `${isImage ? "assets" : "labs"}/${assetId}/${filename}`;

  await putObject({ key, body: input.bytes, contentType: input.contentType });

  return prisma.asset.create({
    data: {
      id: assetId,
      key,
      bucket: "r2",
      contentType: input.contentType,
      sizeBytes: input.bytes.byteLength,
      originalName: input.originalName,
      uploadedById: input.uploadedById,
    },
  });
}

export function assetPublicUrl(key: string) {
  return publicAssetUrl(key);
}
