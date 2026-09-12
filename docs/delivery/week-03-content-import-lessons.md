# Week 3 Focus: Content, Curriculum Import, and Lessons

**Dates:** August 31–September 6, 2026  
**Primary outcome:** All 48 curriculum folders become reviewable draft lessons and one full track is deliverable.

## Objective

Complete the versioned page-builder pipeline, R2 asset handling, curriculum import, publication workflow, lesson rendering, browser labs, and sequential learner progression.

## Goal

By Friday, every source folder imports deterministically as a validated draft, staff can review and publish content, and learners can navigate one complete track without treating lab-local state as LMS progress.

## Monday: content contract — decisions recorded 2026-09-12

Solo work; both deliverable columns below are one person's decisions. Block
schema and publication rules are covered in `docs/content/block-schema.md`
and ADR 0002; this section covers the rest of Monday's procedure, grounded
against the real `Software-Dev-2026` source (48 `Lesson N/` folders, each
with `notes/`, `exercises/`, optionally `assignments/` and `examples/`).

### Source-to-block mapping

| Source pattern | Maps to |
| --- | --- |
| Markdown heading (`##`/`###`) | `heading` (level 2/3; the lesson's own title is never re-declared as an in-body `h1`) |
| Prose paragraph, bold/italic/inline-code/links | `paragraph` (rich text spans) |
| Bulleted/numbered list, one level of sub-bullets | `list` |
| Markdown table | `table` |
| Fenced code block (` ```html `, ` ```javascript `, ...) | `code`, `data.language` from the fence tag |
| `**Goal:**` / `*Tip:*` / `**Challenge:**` / warning-style callouts | `callout`, tone `info` (goal/tip) or `warning` |
| `examples/*.html` standalone interactive pages (e.g. `html-simulator-lab/index.html`) | uploaded to R2 as an `Asset`, referenced by a `lab` block |
| `assignments/assignment_brief.md` | becomes an `Assignment.instructions` document (same block schema, not inline lesson blocks) - the lesson body gets a `submissionPrompt` or `assignment` block pointing at it |
| `exercises/*.md` | lesson-body content (paragraph/list/callout/code blocks), not a separate `Assignment` record - exercises are practice, not graded submissions |
| `notes/tutor_notes.md` | staff-only reference, not imported into the learner-facing document at all |

### Import report format

One JSON report per import run, one entry per source folder:

```ts
type ImportReport = {
  runId: string;
  startedAt: string;
  folders: Array<{
    sourcePath: string;        // e.g. "Lesson 10/"
    lessonSlug: string;
    outcome: "imported" | "unchanged" | "failed";
    warnings: Array<{ code: string; message: string; sourceFile?: string }>;
    unsupported: Array<{ sourceFile: string; reason: string }>; // content dropped is always named here, never silently discarded
    assets: Array<{ sourceFile: string; assetId?: string; status: "uploaded" | "failed"; error?: string }>;
  }>;
};
```

Reruns are idempotent and resumable: each folder's identity is its source
path (stored on the `Lesson`/`LessonVersion` via import metadata), so a
rerun updates the same draft lesson rather than creating a duplicate.

### R2 asset rules

- Bucket/key shape: `lessons/{lessonId}/{assetId}.{ext}` for imported lesson
  assets; `labs/{assetId}/` (a small static bundle, not a single file) for
  interactive lab pages.
- Allowed content types: `image/{png,jpeg,webp,gif,svg+xml}`, `text/html`
  (labs only, served with a restrictive CSP - see below), `application/javascript`
  and `text/css` (lab bundle siblings only, never referenced standalone).
- Size limits: 10 MB per image, 25 MB per lab bundle.
- Ownership: every `Asset.uploadedById` is the importer's system actor or
  the staff member who uploaded it; only that actor or `content.publish`
  staff can replace/archive it.
- Access: lesson images are public-read (served from `R2_PUBLIC_ASSET_ORIGIN`);
  lab bundles are public-read but served from a separate subdomain/origin so
  they never share an origin with the LMS app (see CSP model).
- Uploads never overwrite an existing key; a re-import that changes an
  asset's bytes gets a new `assetId` and the old one is archived, not deleted
  (published lesson versions may still reference it).

### Progression contract

- `LessonProgress.status` (`LOCKED`/`AVAILABLE`/`IN_PROGRESS`/`COMPLETED`) is
  the single source of truth; there is no separate prerequisite graph.
  Unlock rule: lesson N+1 (by `order`, within a module, then across modules
  in course order) becomes `AVAILABLE` when lesson N reaches `COMPLETED`.
  The first lesson of a track is `AVAILABLE` on enrollment.
- `CohortRelease` additionally gates a lesson behind a `releaseAt` date for
  managed-cohort offerings: a lesson otherwise `AVAILABLE` by sequence still
  reads as `LOCKED` to the learner until `releaseAt` passes. Self-paced
  offerings have no `CohortRelease` rows and are gated by sequence alone.
- Enforced authoritatively server-side (progress-mutation endpoints check
  both rules before accepting a "start"/"complete" action); the frontend
  reflects state, it does not decide it - direct URL access to a `LOCKED`
  lesson's route must still be rejected server-side.

### CSP and lab-sandbox model

- Labs render in an `<iframe>` pointed at a dedicated lab origin (a
  subdomain distinct from both the admin and learner app origins), never
  same-origin, so a compromised/malicious lab page cannot read/write LMS
  cookies or the parent DOM.
- Iframe attributes: `sandbox="allow-scripts allow-forms"` only - no
  `allow-same-origin` (keeps the lab's own storage/cookies isolated from
  everything else) and no `allow-top-navigation`/`allow-popups`.
- The lab origin's own response CSP: `default-src 'self'; script-src 'self'
  'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors
  <learner-app-origin>` (labs are static single-purpose pages; the source
  material's inline `<script>` tags are the reason `unsafe-inline` is scoped
  to that isolated origin only, never to the LMS app's own CSP).
- The LMS app's own CSP forbids `unsafe-inline` and only allows framing the
  dedicated lab origin (`frame-src <lab-origin>`).
- If a lab needs to report state back (e.g. "exercise complete"), it does so
  via `postMessage`, and the parent validates both the exact origin and a
  registered message schema before trusting it - never a bare
  `event.data` read.

### UI flow map

- **Editor:** select lesson -> load latest `LessonVersion` (draft or a new
  draft forked from the current published one) -> block list with
  add/reorder/edit-in-place per block type -> inline Zod validation errors
  surface per block, not just on save -> preview pane renders the same
  block renderers learners see -> publish action only enabled when
  validation passes.
- **Lesson renderer (learner):** resolve current published `LessonVersion`
  -> render blocks in order via a per-type renderer registry -> unknown
  block type/version renders a safe "content unavailable" placeholder, never
  a crash or raw JSON.
- **Navigation:** module/lesson tree with lock icons from
  `LessonProgress.status`; clicking a `LOCKED` lesson explains why (sequence
  or release date) rather than 404ing silently.
- **Lab:** lesson renderer's `lab` block mounts the sandboxed iframe lazily
  (on scroll-into-view) pointed at the lab origin; a loading and a
  failed-to-load state are both explicit.
- **Manual review (staff):** a queue of `LessonVersion`s filtered by
  `reviewStatus = PENDING`, one lesson at a time, with the same preview
  renderer as the editor plus an approve / needs-correction action that
  writes `reviewStatus` and an audit event - review is separate from
  publish, so an `APPROVED` lesson still requires an explicit publish action.

## Tuesday: content authoring vertical slice — recorded 2026-09-12

Implemented and verified live against the real dev database (a
`pnpm exec node --experimental-strip-types scripts/tuesday-content-authoring-acceptance.mjs`
run, 14/14 checks passed, cleaned up after itself):

- `POST /api/v1/content/lessons/{lessonId}/versions` - create a draft
  version, optionally forking blocks from an existing version.
- `PATCH /api/v1/content/lesson-versions/{id}` - update a draft's blocks;
  validated against the frozen schema on every write, rejected once the
  version is no longer `DRAFT`.
- `POST /api/v1/content/lesson-versions/{id}/publish` - immutable
  publication (`publishLessonVersion`, already scaffolded).
- `POST /api/v1/content/lesson-versions/{id}/review` - the `reviewStatus`
  field designed Monday, now implemented via a small migration
  (`20260912120000_content_review_and_reusable_block_version`, applied with
  `prisma migrate deploy` - `prisma migrate dev` hung indefinitely on this
  Neon project's shadow-database step even though the database itself was
  reachable in under 3 seconds by a raw client; `migrate deploy` needs no
  shadow database and applied cleanly. Same workaround if this recurs).
- Reusable blocks: create, edit (bumps `ReusableBlock.version`), and resolve
  to an insertable, fully-frozen `reusableSnapshot` block for the editor to
  drop into a draft - verified that editing a reusable block after a
  snapshot was taken does not retroactively change the already-embedded
  copy.
- R2 asset uploads (`src/lib/storage/r2.ts`, `src/domain/content/assets.ts`):
  type/size allowlist enforced before any storage call, key structure
  `assets/{assetId}/{filename}` (images) and `labs/{assetId}/{filename}`
  (lab bundles) - refined from Monday's `lessons/{lessonId}/...` sketch once
  it was clear `Asset` has no `lessonId` column (it's a standalone,
  reusable-across-contexts entity in the schema, not lesson-owned). Not yet
  verified against a real upload: **no Cloudflare R2 credentials exist in
  this environment yet** (checked `.env` and Vercel project env vars - both
  empty). The endpoint's own validation (content-type allowlist, size
  limits) runs and was tested before any R2 call is made.

**A real bug found and fixed**: `publishLessonVersion` (from the original
foundational scaffolding) called `validateContentDocument(version.document.blocks)`
- passing just the blocks array where the schema expects `{ schemaVersion,
blocks }`. Every publish attempt failed validation regardless of content;
nothing could ever be published. Caught by the live acceptance run, not by
review. Fixed to pass the full document shape.

**Staff editor UI** (`/content`, `/content/lesson-versions/[id]`):
add/reorder/remove blocks, live client-side validation per block (reusing
the same Zod schema as the API, not a duplicate), a preview tab using the
same block renderers, an asset picker with inline upload, and a raw-JSON
fallback editor for block types without a dedicated form yet (table, video,
file, embed, lab, quiz, assignment, projectBrief, submissionPrompt,
reusableSnapshot, columns, tabs, accordion - heading/paragraph/list/code/
callout/image/divider have real forms). Verified live: seeded a real
lesson+draft version, fetched both pages over HTTP with a real staff
session cookie, confirmed the expected content rendered server-side, then
cleaned up. Browser-level visual/interaction QA (does it *look* right, do
the buttons feel right) still needs a human - I can't drive a browser.

## Wednesday: curriculum importer, all 48 folders, review workflow — recorded 2026-09-12

Real run against the real `Software-Dev-2026` source repo and the real dev
database - `npx tsx scripts/import-curriculum.mjs`:

- **48/48 lesson folders imported as drafts.** One Track ("Software
  Development 2026") / Course ("Core Curriculum") / Module ("Foundations")
  with 48 ordered Lessons. Idempotent and resumable, verified by running the
  full import twice: the second run left every lesson at version 1 (updated
  the existing draft in place rather than creating duplicates), keyed by a
  deterministic `lesson-{N}` slug (there's no dedicated source-path column;
  the slug already encodes it exactly, so this needed no schema change).
- **Markdown → blocks** (`src/domain/content/markdown.ts`, via `remark` +
  `remark-gfm`): headings, paragraphs, lists (one level of nesting), code
  fences, tables, thematic breaks, and blockquotes (→ `callout`) all map
  correctly; raw inline/block HTML in the source is never imported as
  trusted content (dropped with an `html.unsupported` warning, per ADR
  0002) - this is a real, useful diagnostic: it caught two spots in Lesson
  12 where a source file has an HTML example written without a fenced code
  block. Each `README.md`'s "Learning Objectives" list is captured into
  `LessonVersion.objectives` structurally rather than imported as a body
  list.
- **Composition per lesson**: `notes/student_notes.md` is the lesson body;
  `exercises/*.md` and `assignments/*.md` are appended under synthetic
  headings (assignments are body content for now, not true `Assignment`
  records - those need a `Rubric`, which is Week 4 scope and doesn't exist
  yet); `examples/*.html` files are uploaded to R2 and referenced as `lab`
  blocks; `notes/tutor_notes.md` is intentionally never imported (staff-only
  per Monday's mapping).
- **R2 still isn't configured** in this environment, so every lab-file
  upload attempt fails with `Missing required environment variable:
  R2_BUCKET` - handled exactly as designed: recorded as a per-file
  `unsupported`/`assets` diagnostic entry, the lesson still imports
  successfully without that one block. Once real R2 credentials exist, a
  rerun will pick these up (each failed upload is retried fresh on rerun;
  already-succeeded ones aren't currently deduped, but that's moot until
  the first real upload succeeds at all).
- **A real bug found while doing this**: some source links are relative
  file paths (e.g. `../examples/foo.js`), which `z.string().url()`
  correctly rejects - but the original link-handling code let that
  `ZodError` blow up the entire lesson's import. 7 lessons (25-31) failed
  outright on the first full run for exactly this reason. Fixed by
  detecting non-absolute-URL link targets at parse time and demoting them
  to plain text (with an `link.relative` warning) instead of failing
  validation - the link's visible text is preserved, it just isn't
  clickable. Second full run: 48/48 imported, 0 failed.
- A second, now-familiar bug from the same class as Friday's and Tuesday's:
  `POST /lesson-versions/{id}/review` was missing `TRANSACTION_OPTIONS`,
  and hit the same Neon-latency `P2028` timeout under real sequential load
  (reviewing 12 lessons back to back). Fixed the same way.

**Block renderers completed** (`src/components/content/block-renderers.tsx`):
every one of the 19 Phase 1 block types now has a preview renderer (video,
file, embed, lab, quiz, assignment, submissionPrompt, projectBrief,
columns, tabs, and accordion were added today; the other 8 already existed
from Tuesday).

**Manual-review workflow built**: a review queue (`/content/review`, staff
with `content.publish`, lists every `LessonVersion` with `reviewStatus =
PENDING`) and approve/needs-correction controls with an optional note
directly in the lesson editor, both backed by Tuesday's review endpoint.
The Content index page shows a live pending-review count.

**Lessons 1-12 reviewed**, for real, via the real API
(`scripts/review-lessons-1-12.mjs`): 11 approved (their only diagnostic is
a lab upload pending R2 credentials - the imported content itself is
complete and correct), 1 (`lesson-12`) marked `NEEDS_CORRECTION` with a
specific, actionable note describing exactly which source file and which
example needs a code fence before it can be re-imported with that content
intact. Verified: `reviewStatus` in the database matches the 11/1 split,
21 matching `AuditEvent` rows exist (9 from an interrupted first run before
the `TRANSACTION_OPTIONS` fix, 12 from the successful full rerun), and a
live HTTP render of `/content/review` and `/content` both reflect the
correct counts and badges.

## Thursday: secure lesson-delivery vertical slice — recorded 2026-09-12

Backend (`src/domain/content/progression.ts` and three new `/api/v1/learn/*`
endpoints, added to the OpenAPI contract) and frontend (learner app:
`/dashboard/learn`, `/dashboard/learn/[lessonId]`), verified live - 14/14
checks in `scripts/thursday-lesson-delivery-acceptance.mjs` against the
real dev server and database, plus a real cross-app page-load check.

- **Prerequisites and progress**: `LessonProgress.status` is the single
  source of truth (matches Monday's contract); a lesson unlocks once the
  previous lesson in track order is `COMPLETED`, computed on read rather
  than pre-populated for every lesson at enrollment.
- **Cohort release enforcement**: `CohortRelease` gates a lesson behind a
  date even if sequence would otherwise allow it, checked in the same
  `getLessonAccess()` path as the prerequisite check.
- **Scheduled publication**: `scheduleLessonVersion()` sets a version to
  `SCHEDULED`; `applyDueScheduledPublication()` runs at the top of every
  lesson-access check and publishes it for real the moment `scheduledFor`
  has passed - no cron needed for correctness, verified by scheduling a
  version 2 seconds out, waiting past it, and confirming a plain read
  triggered the real publish.
- **Iframe messaging validation and sandbox controls**: labs render in a
  sandboxed `<iframe sandbox="allow-scripts allow-forms">` (no
  `allow-same-origin`, no top-navigation, no popups) on the R2 asset
  origin - a different origin from the learner app by construction, so no
  extra infrastructure was needed for that isolation. `postMessage` is only
  trusted after checking `event.origin` against the lab's real resolved
  origin, then validated against a closed two-value message schema
  (`lib/labs/messaging.ts`, frontend). The frontend also sets a
  `Content-Security-Policy: frame-src` header on `/dashboard/learn/*`
  restricting what it may frame at all - real defense in depth, but the
  primary control is the iframe `sandbox` attribute, not this header.
- **A real bug found by the live run**: `getLessonAccess()`'s asset-URL
  resolution originally guessed the R2 key shape as `assets/{assetId}`
  instead of looking up the real stored `Asset.key` (which includes the
  original filename, e.g. `assets/{assetId}/{filename}` per Tuesday's
  rules) - every resolved image/file/lab URL would have 404'd. Fixed by
  batch-querying the real `Asset` rows for every block's `assetId` instead
  of reconstructing the key.
- **Real, permanent action**: lesson-1 and lesson-2 (both reviewed
  `APPROVED` on Wednesday) are now genuinely `PUBLISHED` - not test data,
  real curriculum state, verified end to end: a test learner with no
  entitlement is rejected, granted access via the real Week 2 manual-grant
  endpoint, sees lesson-1 as `AVAILABLE` with real rendered content,
  lesson-2 as locked (`LOCKED_SEQUENCE`) until lesson-1 is marked
  `COMPLETED` through the real progress endpoint, at which point lesson-2
  unlocks - and a direct-URL request for a much-later, still-unpublished
  lesson is still rejected server-side regardless of the requester.
- **Not verified today**: an actual completed Paystack-style "real browser"
  interaction isn't relevant here, but the client-side data-fetching and
  rendering inside `/dashboard/learn` pages could only be confirmed by a
  real HTTP fetch of the SSR shell (200, correctly gated by cross-app
  session-cookie forwarding) - the client-side `useEffect` fetch-and-render
  path itself needs a real browser to fully confirm, which I can't drive.
  A real R2-hosted lab file also still can't be tested end-to-end (no R2
  credentials in this environment, carried over from Tuesday/Wednesday).

## Assigned weekly deliverables

### Travis — technical deliverables

- Versioned block schemas, migration functions, publication state machine, and immutable published versions.
- Reusable-block snapshots and authorized R2 asset services.
- Deterministic, resumable importer with structured diagnostics for all 48 source folders.
- Lesson, prerequisite, release, scheduled-publication, and authoritative progress APIs.
- Sandboxed-lab origin rules, CSP, message validation, and security tests.

### Mr. Miracle — experience deliverables

- Staff page builder, validation feedback, preview, publishing, asset, and manual-review interfaces.
- Learner renderers for every Phase 1 content block.
- Module navigation, locked states, progress feedback, and browser-lab experience.
- Responsive and accessible editor and lesson components.
- Manual review and correction records for lessons 1–12.

### Shared end-of-week deliverable

All 48 folders exist as diagnosable drafts, lessons 1–12 are reviewed, one track is publishable and learnable sequentially, and published history remains immutable.

## Procedures

### Monday — Content contract

1. Freeze the Phase 1 block catalogue and schema versions.
2. Approve document validation, migration, snapshot, and publication rules.
3. Map curriculum source patterns to page-builder blocks.
4. Define an import report format for warnings, unsupported content, and asset failures.
5. Define lesson prerequisite and release-date behavior.

### Tuesday — Documents and assets

1. Implement strict block validation and registered migration functions.
2. Implement reusable blocks and publication-time snapshots.
3. Implement R2 uploads with type, size, ownership, and access checks.
4. Enforce immutable published lesson versions.
5. Build staff editing, preview, validation, and asset UI foundations.

### Wednesday — Curriculum importer

1. Import into drafts only.
2. Preserve source folder identity for deterministic reruns.
3. Generate structured warnings rather than silently dropping content.
4. Upload or map referenced assets safely.
5. Run against all 48 folders and review the report together.

### Thursday — Lesson delivery and progression

1. Build renderers for every supported Phase 1 block.
2. Add module navigation, locked states, completion, and progress feedback.
3. Enforce prerequisites and cohort release dates on the backend.
4. Run HTML/CSS/JavaScript labs from a separate sandboxed origin.
5. Apply restrictive iframe permissions and CSP.

### Friday — Publish and learn

1. Manually review imported drafts and classify required corrections.
2. Publish a representative full module and then the full track candidate.
3. Verify published versions cannot be mutated.
4. Complete lessons in sequence and test direct URL bypass attempts.
5. Test scheduled publication and failed asset behavior.

## Best coding practices

- Validate all content at write and publish boundaries.
- Use discriminated unions for block types and explicit schema versions.
- Make import operations deterministic, resumable, and idempotent.
- Preserve the original source reference and import diagnostics.
- Snapshot reusable content when publishing.
- Sanitize rendered content and use allowlists for embeds.
- Keep progression rules in domain services, not React components.
- Provide accessible semantic HTML and keyboard behavior for interactive blocks.

## Don’ts

- Don’t allow administrators to inject executable JavaScript.
- Don’t mutate published lesson versions.
- Don’t publish imported lessons automatically.
- Don’t silently discard unsupported source content.
- Don’t make R2 buckets or private learner files universally public.
- Don’t trust iframe messages without exact origin and schema validation.
- Don’t count lab `localStorage` as authoritative progress.
- Don’t place prerequisite checks only in the frontend.

## Required evidence

- Block-schema tests and migration tests.
- Import report covering all 48 folders.
- Manual-review status for every imported lesson.
- R2 upload authorization and failure-path tests.
- Published-version immutability test.
- Progression bypass and sandbox security evidence.

## Exit gate

Week 3 is complete only when all 48 folders import as drafts, every block renders safely, one complete track is publishable and learnable sequentially, and publication history remains immutable.
