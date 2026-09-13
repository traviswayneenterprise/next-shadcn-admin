import { z } from "zod";

// z.string().url() alone accepts javascript:, data:, and vbscript: URIs -
// all valid WHATWG URLs, all trivial stored-XSS if ever rendered into an
// href/src. Every URL a renderer turns into a real href/src goes through
// one of these scheme (or domain) allowlists instead of the bare .url()
// check. Shared between the v1 (blocks.ts) and v2 (lexical-document.ts)
// content validators so both stay under the same ADR 0002 discipline.
export function schemeAllowedUrl(schemes: readonly string[]) {
  return z.string().url().refine((value) => {
    try {
      return schemes.includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "URL scheme is not allowed.");
}

export const linkHref = schemeAllowedUrl(["http:", "https:", "mailto:"]);
export const httpUrl = schemeAllowedUrl(["http:", "https:"]);

// Tighter than httpUrl: restricts to specific embed-provider hostnames
// (apex domain or a subdomain of it), on top of the http(s)-only scheme
// check. Used for embed node types (YouTube/Twitter-X/Figma) where the
// content is rendered in a sandboxed iframe on the learner side - the
// domain allowlist is the boundary that keeps "embed" from becoming
// "arbitrary iframe to anywhere."
export function domainAllowedUrl(allowedHosts: readonly string[]) {
  return httpUrl.refine((value) => {
    try {
      const { hostname } = new URL(value);
      return allowedHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }, "URL host is not on the embed allowlist.");
}
