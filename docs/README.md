# LMS Architecture Documentation

This directory is the authoritative source for decisions shared by the learner
frontend and backend/admin repositories.

## Review rules

- Architecture, schema, authentication, OpenAPI, payments, RBAC, and
  certificates require a pull request and the product owner's approval.
- Every implementation issue names one primary implementer and one reviewer.
- Accepted architecture changes add or supersede an ADR; accepted ADRs are not
  rewritten to hide earlier decisions.
- The OpenAPI document is the contract between the repositories.

## Documents

- [Phase 1 architecture](architecture/phase-1.md)
- [Domain glossary](domain-glossary.md)
- [Data ownership](data-ownership.md)
- [Authentication and authorization](security/authentication-authorization.md)
- [Content block schema](content/block-schema.md)
- [Events and webhooks](operations/events-webhooks.md)
- [Collaboration workflow](collaboration.md)
- [Phase 1 delivery schedule and weekly focus guides](delivery/README.md)
- [Travis and Mr. Miracle task assignments](delivery/task-assignments-travis-miracle.md)
- [Release checklist](release-checklist.md)
- [OpenAPI v1](openapi/lms-v1.yaml)
