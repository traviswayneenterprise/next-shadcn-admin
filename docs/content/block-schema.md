# Content Block Schema

The root document is `{ schemaVersion, blocks }`. Every block has a stable `id`,
registered `type`, integer `version`, and type-specific `data`.

Phase 1 registers text, heading, callout, code, image, video, file, divider,
embed, columns, tabs, accordion, reusable content, lab, quiz, assignment,
project brief, and submission prompt blocks.

Rules:

- Layout blocks contain only validated child blocks and have bounded nesting.
- Embeds use an allowlist. Labs run on a separate origin in sandboxed iframes.
- Published documents contain snapshots, not live reusable-block references.
- Unknown types or versions fail publication; readers show a safe unavailable
  state rather than executing or guessing.
- A schema version is never changed in place. Add a pure migration and fixture.

