# Week 7 Focus: Contingency and Remediation

**Dates:** September 28–October 4, 2026  
**Primary outcome:** Resolve verified release blockers without expanding scope.

## Objective

Use the reserved contingency window to fix defects, complete failed recovery or provider tests, and repeat the beta gate. This week is not an additional feature sprint.

## Goal

By the final review, every previously failed acceptance item is either fixed with passing evidence or explicitly blocks the beta release.

## Assigned weekly deliverables

### Travis — technical deliverables

- Frozen remediation scope covering only mandatory gate failures and verified high-severity defects.
- Root-cause fixes for backend, security, payment, provider, data, deployment, and recovery blockers.
- Regression coverage and repeated technical gate evidence.
- Final residual-risk review and explicit release decision.

### Mr. Miracle — experience deliverables

- Reproduced frontend, integration, browser, responsive, and accessibility blockers.
- Focused experience fixes with component, integration, or browser regression coverage.
- Repeated learner and staff journey evidence across supported browsers.
- Confirmation that no temporary bypasses, debug states, or incomplete interactions remain.

### Shared end-of-week deliverable

Every mandatory beta gate passes with reproducible evidence, or the release is formally delayed without bypassing requirements.

## Procedures

### Monday — Triage

1. Collect only unresolved Week 6 gate failures and confirmed high-severity defects.
2. Rank by security, data integrity, payment/access correctness, learner completion, and operability.
3. Assign an implementer and reviewer to each accepted remediation.
4. Reject new features and cosmetic scope unless they block accessibility or usability.

### Tuesday and Wednesday — Focused remediation

1. Reproduce every defect with a failing automated test when practical.
2. Apply the smallest root-cause fix.
3. Add regression coverage before closing the issue.
4. Cross-review sensitive changes immediately.
5. Deploy fixes behind existing feature flags where risk warrants it.

### Thursday — Recovery and regression

1. Repeat all previously failed provider, recovery, security, and accessibility tests.
2. Run full payment, entitlement, progression, submission, cohort, notification, and certificate regression suites.
3. Verify clean deployment and rollback procedures.
4. Confirm no temporary debug settings, bypasses, or test credentials remain.

### Friday — Final decision

1. Run the release checklist again.
2. Review residual risk and evidence together.
3. Obtain explicit product-owner approval or record the blocking failures.
4. Release only if every mandatory gate passes.

## Best coding practices

- Reproduce before fixing and add regression tests.
- Prefer narrow root-cause changes over broad refactors.
- Use feature flags and reversible deployment steps for risky fixes.
- Preserve logs, correlation IDs, and before/after evidence.
- Re-run affected security and data-integrity tests after every fix.
- Document residual risks and operational mitigations honestly.

## Don’ts

- Don’t add new product features.
- Don’t perform opportunistic dependency upgrades or design rewrites.
- Don’t suppress failing tests, relax authorization, or bypass validation.
- Don’t edit production data manually without an approved, audited procedure.
- Don’t label an unreproduced issue as fixed.
- Don’t ship with unresolved payment, access, security, certificate, or recovery failures.
- Don’t let schedule pressure replace explicit sign-off.

## Required evidence

- Defect reproduction and regression tests.
- Links to remediation PRs and cross-reviews.
- Repeated recovery, security, accessibility, and provider test results.
- Final clean deployment and rollback evidence.
- Final signed beta decision.

## Exit gate

Week 7 ends with either a fully passing beta gate and explicit approval or a documented release delay. There is no partial approval for mandatory requirements.
