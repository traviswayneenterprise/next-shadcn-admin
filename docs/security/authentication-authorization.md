# Authentication and Authorization

- Auth.js v5 runs in backend/admin with PostgreSQL database sessions.
- Supported identities are Google OAuth and verified email/password.
- Passwords use Argon2id. Verification and reset tokens are hashed, expiring,
  single-use records.
- The production session cookie is encrypted, secure, HTTP-only, SameSite Lax,
  and scoped to the shared parent domain.
- Credentialed CORS accepts only the configured learner origin. State-changing
  browser requests validate Origin and CSRF state.
- Authentication answers who the user is. Staff RBAC answers which staff actions
  are allowed. Learner entitlements answer what paid content is accessible.
- A fixed permission catalogue is composed into admin-created roles. Role
  assignments may be global, track-scoped, or cohort-scoped.
- The owner role cannot be deleted. A staff member cannot grant a permission they
  do not hold in the same or broader scope.
- Sensitive actions write append-only audit events with actor, target, request
  correlation ID, timestamp, and structured metadata.

