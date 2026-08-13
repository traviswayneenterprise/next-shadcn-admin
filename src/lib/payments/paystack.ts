import { createHmac, timingSafeEqual } from "node:crypto";

import { env, requireEnvironment } from "@/lib/env";

type PaystackEnvelope<T> = { status: boolean; message: string; data: T };

async function paystackRequest<T>(path: string, init?: RequestInit) {
  requireEnvironment("PAYSTACK_SECRET_KEY");
  const response = await fetch(`https://api.paystack.co${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const result = (await response.json()) as PaystackEnvelope<T>;
  if (!response.ok || !result.status) throw new Error(`Paystack request failed: ${result.message}`);
  return result.data;
}

export function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  currency: "NGN" | "USD";
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return paystackRequest<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function verifyPaystackTransaction(reference: string) {
  return paystackRequest<{
    reference: string;
    status: string;
    amount: number;
    currency: string;
    paid_at: string | null;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  requireEnvironment("PAYSTACK_SECRET_KEY");
  if (!signature) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY!).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}
