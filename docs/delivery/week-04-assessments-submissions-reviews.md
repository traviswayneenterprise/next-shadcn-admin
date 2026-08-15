# Week 4 Focus: Assessments, Submissions, and Reviews

**Dates:** September 7–13, 2026  
**Primary outcome:** Mastery checks and human-reviewed project work operate end to end.

## Objective

Deliver versioned quizzes, attempts, cooldowns, assignments, submission history, reviewer assignment, versioned rubrics, feedback decisions, and certificate-eligibility inputs.

## Goal

By Friday, learners can complete quizzes and projects while every attempt, submission version, reviewer assignment, rubric version, decision, and feedback event remains traceable.

## Assigned weekly deliverables

### Travis — technical deliverables

- Versioned assessment, attempt, assignment, submission, rubric, review, and eligibility contracts.
- Server-side quiz randomization, grading, explanations, attempt preservation, and cooldown enforcement.
- Authorized submission assets, immutable submission versions, and validated external URLs.
- Concurrency-safe reviewer assignments, scoped decisions, audit events, and notifications.
- Certificate-requirement reevaluation and negative authorization tests.

### Mr. Miracle — experience deliverables

- Quiz-taking, results, explanations, retries, cooldown, and mastery states.
- Submission, upload, resubmission, history, and feedback experiences.
- Staff pending-review queue, reviewer assignment, versioned rubric, feedback, and decision screens.
- Accessible status timelines, validation, empty, loading, and unauthorized states.
- Manual review and correction records for lessons 13–24.

### Shared end-of-week deliverable

Assessment and human review work end to end, every version is preserved, eligibility inputs update authoritatively, and lessons 13–24 are reviewed.

## Procedures

### Monday — Assessment rules

1. Approve quiz, question, attempt, cooldown, assignment, submission, review, and rubric contracts.
2. Define scoring and rounding rules with test examples.
3. Define configurable certificate requirements and milestone mapping.
4. Define reviewer permissions and assignment state transitions.
5. Prepare fixtures for pass, fail, cooldown, resubmit, and review scenarios.

### Tuesday — Quiz engine

1. Implement versioned questions and quiz versions.
2. Randomize presentation without changing authoritative question identity.
3. Grade server-side and preserve submitted answers.
4. Implement unlimited attempts and configurable cooldown thresholds.
5. Build quiz, result, explanation, retry, and cooldown UI.

### Wednesday — Submissions

1. Validate GitHub and deployment URLs without assuming they are safe content.
2. Implement notes and optional authorized R2 files.
3. Preserve immutable submission versions and status history.
4. Build learner submission and resubmission experiences.
5. Display previous versions and feedback clearly.

### Thursday — Reviewer workflow

1. Implement pending-review queue and reviewer assignment.
2. Snapshot or reference the exact rubric version used.
3. Implement approval, changes requested, and rejection decisions.
4. Build staff review, rubric scoring, and feedback screens.
5. Trigger eligibility reevaluation only from authoritative accepted events.

### Friday — Mastery acceptance

1. Test randomized order, scoring, explanations, retakes, and cooldowns.
2. Test resubmission without losing earlier versions.
3. Test concurrent reviewer assignment and unauthorized review attempts.
4. Verify certificate requirement inputs update correctly.
5. Review audit and notification records.

## Best coding practices

- Grade on the backend against a fixed quiz version.
- Preserve attempts and submission versions as immutable evidence.
- Use explicit state machines for submission and review transitions.
- Protect reviewer assignment against concurrent updates.
- Validate URLs and uploaded file metadata; render external links safely.
- Keep rubric criteria ordered and versioned.
- Use deterministic scoring tests at boundary values.
- Make feedback accessible, actionable, and associated with a specific version.

## Don’ts

- Don’t send correct answers to the browser before submission.
- Don’t overwrite earlier attempts, submissions, rubrics, or feedback.
- Don’t let the frontend decide whether a learner passed.
- Don’t use client clocks to enforce cooldowns.
- Don’t permit reviewers to review outside their allowed scope.
- Don’t allow two active assignments for the same review without conflict handling.
- Don’t fetch or execute arbitrary code from submitted repositories.
- Don’t mark certificate eligibility from an unapproved project submission.

## Required evidence

- Quiz scoring, randomization, retake, and cooldown tests.
- Submission and resubmission version history.
- Reviewer authorization and concurrency tests.
- Rubric-version and feedback audit records.
- Certificate-requirement reevaluation output.

## Exit gate

Week 4 is complete only when assessment and review workflows pass end to end, unauthorized decisions are blocked, and all evidence required for later certificate eligibility is preserved.
