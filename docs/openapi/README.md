# LMS API v1 contract

`lms-v1.yaml` is the authoritative browser/API contract. All paths are relative
to `/api/v1`; deployment hosts are deliberately supplied by each environment.

## Authentication routes

| Method | Path | Purpose | Session required |
| --- | --- | --- | --- |
| POST | `/auth/register` | Create a verified-email learner account flow | No |
| POST | `/auth/verify-email` | Consume an email verification token | No |
| POST | `/auth/password-login` | Start a database-backed session | No |
| POST | `/auth/forgot-password` | Request a reset email without account disclosure | No |
| POST | `/auth/reset-password` | Consume a reset token and revoke earlier sessions | No |
| GET | `/auth/session` | Read the current learner/staff session | Yes |
| POST | `/auth/logout` | Revoke the current session | Yes |

Browser writes use the encrypted shared-parent-domain session cookie. The API
must validate `Origin`/CSRF policy and credentialed CORS against the exact
learner origin. Clients must never store the session token in browser storage.

## Contract and client workflow

1. Change `lms-v1.yaml` and keep compatible additions in v1.
2. Run `pnpm api:check`; lint warnings are treated as failures.
3. Review the generated schema and bundled JSON in the same pull request.
4. Bump `packages/api-client/package.json` using semantic versioning.
5. Merge, tag `api-client-vX.Y.Z`, and allow the release workflow to publish
   `@traviswayneenterprise/lms-api-client` to GitHub Packages.
6. Pin that exact version in the learner frontend and complete cross-repository
   integration review.

Breaking response, request, or route changes require `/api/v2`. The checked-in
bundle is also the input for the development-only frontend reference renderer.

