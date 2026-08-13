# ADR 0002: Versioned JSON content documents

- Status: accepted
- Date: 2026-08-13
- Owner: product owner

## Context

Editors need an extensible page builder without allowing arbitrary executable
content or silently changing lessons already completed by learners.

## Decision

Lesson bodies are validated JSON documents composed of developer-registered
block types. Published lesson versions and reusable-block snapshots are
immutable. Large assets and labs are stored in R2.

## Consequences

Every block type requires a schema, renderer, editor, and schema migration.
Admin-provided JavaScript and arbitrary HTML are forbidden.

## Verification

Fixtures for every schema version render in tests. Publication snapshots all
references and rejects invalid or unsupported blocks.

