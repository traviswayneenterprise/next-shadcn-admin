import assert from "node:assert/strict";
import test from "node:test";

import { generateCsrfToken, isValidCsrfToken, requiresCsrfCheck } from "../src/lib/auth/csrf.ts";

test("CSRF is only required once a session cookie grants ambient authority", () => {
  assert.equal(
    requiresCsrfCheck({ method: "POST", hasSessionCookie: true, isOriginProtectedPath: true }),
    true,
  );
  assert.equal(
    requiresCsrfCheck({ method: "POST", hasSessionCookie: false, isOriginProtectedPath: true }),
    false,
  );
});

test("CSRF is never required for safe methods or the webhook exemption", () => {
  assert.equal(
    requiresCsrfCheck({ method: "GET", hasSessionCookie: true, isOriginProtectedPath: true }),
    false,
  );
  assert.equal(
    requiresCsrfCheck({ method: "POST", hasSessionCookie: true, isOriginProtectedPath: false }),
    false,
  );
});

test("a valid CSRF token requires the header to match the cookie exactly", () => {
  assert.equal(isValidCsrfToken("abc", "abc"), true);
  assert.equal(isValidCsrfToken("abc", "def"), false);
  assert.equal(isValidCsrfToken(null, "abc"), false);
  assert.equal(isValidCsrfToken("abc", null), false);
  assert.equal(isValidCsrfToken(undefined, undefined), false);
});

test("generated CSRF tokens are unique", () => {
  const a = generateCsrfToken();
  const b = generateCsrfToken();
  assert.notEqual(a, b);
  assert.ok(a.length > 0);
});
