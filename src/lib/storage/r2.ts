// Deliberately no "server-only" marker: this module is also imported by
// scripts/import-curriculum.mjs (a plain Node/tsx script, not a Next.js
// server context) - the marker's real-world protection (never let this
// reach a browser bundle) already holds structurally, since every other
// caller is a route.ts handler or a script, never a "use client" component.
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env, requireEnvironment } from "@/lib/env";

let client: S3Client | undefined;

function getClient() {
  requireEnvironment("R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY");
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
    });
  }
  return client;
}

export async function putObject(input: { key: string; body: Buffer; contentType: string }) {
  requireEnvironment("R2_BUCKET");
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    }),
  );
}

export function publicAssetUrl(key: string) {
  requireEnvironment("R2_PUBLIC_ASSET_ORIGIN");
  return new URL(key, env.R2_PUBLIC_ASSET_ORIGIN).toString();
}
