import assert from "node:assert/strict";
import test from "node:test";

import { isOriginProtectedPath, isSafeMethod, isTrustedOrigin } from "../src/lib/auth/origin.ts";

test("safe methods are recognized case-insensitively", () => {
  assert.equal(isSafeMethod("get"), true);
  assert.equal(isSafeMethod("POST"), false);
});

test("browser writes trust only the backend or configured learner origin", () => {
  assert.equal(isTrustedOrigin("https://learn.example.com", "https://admin.example.com", "https://learn.example.com"), true);
  assert.equal(isTrustedOrigin("https://admin.example.com", "https://admin.example.com", "https://learn.example.com"), true);
  assert.equal(isTrustedOrigin(null, "https://admin.example.com", "https://learn.example.com"), false);
  assert.equal(isTrustedOrigin("https://evil.example", "https://admin.example.com", "https://learn.example.com"), false);
});

test("only the signed Paystack webhook bypasses browser Origin enforcement", () => {
  assert.equal(isOriginProtectedPath("/api/v1/auth/password-login"), true);
  assert.equal(isOriginProtectedPath("/api/v1/payments/paystack/webhook"), false);
});
