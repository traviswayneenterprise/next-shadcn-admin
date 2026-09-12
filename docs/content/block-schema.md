# Content Block Schema

The root document is `{ schemaVersion, blocks }`. Every block has a stable `id`,
registered `type`, integer `version`, and type-specific `data`.

Phase 1 (schema version 1, frozen 2026-09-12) registers: paragraph, heading,
list, table, callout, code, image, video, file, divider, embed, columns,
tabs, accordion, reusable-block snapshot, lab, quiz, assignment, project
brief, and submission prompt blocks. See `src/domain/content/blocks.ts` for
the authoritative Zod definitions.

Rich text (paragraph, list items, table cells) is a bounded array of text
spans and link spans with a closed set of marks (bold, italic, code) - never
a stored HTML string. This directly enforces ADR 0002 ("admin-provided
arbitrary HTML forbidden"): the original schema had a `text` block storing a
raw `html` string, which violated that ADR and has been replaced.

Rules:

- Layout blocks contain only validated child blocks and have bounded nesting.
  Lists nest one level deep (items may have flat `children`, not an
  unbounded recursive tree).
- Embeds use an allowlist. Labs run on a separate origin in sandboxed iframes
  and reference an uploaded R2 asset (`data.assetId`), never inline script.
- Published documents contain snapshots, not live reusable-block references.
  A snapshot's `blocks` validate against the same leaf-block schema as any
  other document (not `z.unknown()`) and can never itself contain another
  snapshot reference - a snapshot is fully-resolved content by definition.
- Unknown types or versions fail publication; readers show a safe unavailable
  state rather than executing or guessing.
- A schema version is never changed in place. Add a pure migration and fixture.

## Migration function registry (design, implemented Tuesday)

Each schema version's document only ever validates against its own version's
schema. Moving a stored document forward is a separate, explicit step:

```ts
type Migration = (raw: unknown) => unknown; // v(N) shape -> v(N+1) shape
const migrations: Record<number, Migration> = { 1: /* v1 -> v2, once v2 exists */ };

function migrateContentDocument(raw: { schemaVersion: number; blocks: unknown }) {
  let value: unknown = raw;
  let version = raw.schemaVersion;
  while (migrations[version]) value = migrations[version](value), version += 1;
  return validateContentDocument(value); // validates against the current version only
}
```

Rules: migrations are pure functions, one per version step, each with a
fixture-backed test (a real v(N) document in, a real v(N+1) document out).
Never mutate a stored document in place to "fix" its version - read old,
migrate in memory, validate, then write as a new version if persisted.

## Review status (design, implemented Tuesday)

`LessonVersion` gets a `reviewStatus` column (`PENDING` default, `APPROVED`,
`NEEDS_CORRECTION`) separate from `status` (`PublishStatus`). Publication
does not require `APPROVED`, but the importer's Wednesday report and the
staff review UI key off this field - it is how "every imported lesson has a
review status" (Friday's required evidence) is actually tracked, since
`DRAFT` alone can't distinguish "not yet looked at" from "looked at, needs a
fix" from "looked at, fine as-is."

