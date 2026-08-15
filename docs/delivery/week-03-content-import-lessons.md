# Week 3 Focus: Content, Curriculum Import, and Lessons

**Dates:** August 31–September 6, 2026  
**Primary outcome:** All 48 curriculum folders become reviewable draft lessons and one full track is deliverable.

## Objective

Complete the versioned page-builder pipeline, R2 asset handling, curriculum import, publication workflow, lesson rendering, browser labs, and sequential learner progression.

## Goal

By Friday, every source folder imports deterministically as a validated draft, staff can review and publish content, and learners can navigate one complete track without treating lab-local state as LMS progress.

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
