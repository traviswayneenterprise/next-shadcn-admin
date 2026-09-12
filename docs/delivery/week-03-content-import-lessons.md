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
