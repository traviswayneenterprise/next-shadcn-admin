import { env, requireEnvironment } from "@/lib/env";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
};

export async function sendTransactionalEmail(input: EmailInput) {
  requireEnvironment("RESEND_API_KEY");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      ...input,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend rejected transactional email (${response.status})`);
  }

  return response.json() as Promise<{ id: string }>;
}
