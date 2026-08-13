# ADR 0001: Separate repositories with a strict API boundary

- Status: accepted
- Date: 2026-08-13
- Owner: product owner

## Context

The learner frontend and backend/admin deploy independently and are maintained
simultaneously by two collaborators.

## Decision

The backend/admin owns Prisma and all authoritative business behavior. The
learner frontend accesses it through versioned REST endpoints described by
OpenAPI. The backend publishes the generated TypeScript client.

## Consequences

The frontend must not import Prisma or retain provider secrets after extraction.
API changes land before their generated-client and frontend integrations.

## Verification

Frontend CI rejects Prisma dependencies and imports after the extraction flag is
enabled. Contract tests validate backend responses against OpenAPI.

