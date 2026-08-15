# Week 6 Focus: Certificates, Hardening, and Beta

**Dates:** September 21–27, 2026  
**Primary outcome:** The complete system passes the external-beta gate.

## Objective

Complete certificate eligibility, approval, generation, verification, revocation, and reissue; then harden security, accessibility, recovery, portability, and operations across both applications.

## Goal

By Friday, an eligible learner can receive a verifiable certificate only after authorized approval, and every Phase 1 beta-acceptance requirement has documented passing evidence.

## Assigned weekly deliverables

### Travis — technical deliverables

- Versioned eligibility requirements, authoritative evaluation, pending approvals, and scoped approval APIs.
- Cryptographically opaque tokens, PDF/QR generation, R2 storage, privacy-filtered verification, revocation, and reissue.
- Webhook, job, delivery, audit, and security operational APIs and runbooks.
- RBAC matrix, database restore, R2 lifecycle, secret rotation, Docker/VPS, replay, retry, and clean-deployment evidence.
- Final API, domain, security, operational, and beta-release approval.

### Mr. Miracle — experience deliverables

- Learner pending, approved, download, revoked, and reissued certificate states.
- Staff approval, lifecycle, operational failure, replay, and retry interfaces.
- Public verification page exposing only approved and consented fields.
- Complete responsive, keyboard, focus, reduced-motion, accessibility, and browser QA.
- Manual review and correction records for lessons 37–48.

### Shared end-of-week deliverable

The certificate lifecycle and operational recovery pass, all 48 lessons are reviewed, every beta gate has evidence, and Travis records an explicit ship-or-delay decision.

## Procedures

### Monday — Eligibility and approval

1. Freeze configured certificate requirements for the beta track.
2. Evaluate requirements from authoritative lesson, quiz, and assignment records.
3. Create pending approval records idempotently.
4. Enforce certificate approval permission and scoped authorization.
5. Build learner pending state and staff approval queue.

### Tuesday — Generation and verification

1. Generate a PDF with an opaque non-sequential verification token and QR code.
2. Store immutable certificate files in R2.
3. Implement public verification with the minimal approved fields.
4. Include portfolio links only when the learner has consented.
5. Build certificate display, download, and public verification pages.

### Wednesday — Lifecycle and operations

1. Implement revocation and reissue with mandatory reasons.
2. Preserve every certificate lifecycle event and file reference.
3. Complete admin screens for webhook, job, delivery, audit, and security failures.
4. Test job retries and webhook replay from operator workflows.
5. Confirm certificate language makes no academic or regulatory accreditation claim.

### Thursday — Hardening and recovery

1. Run RBAC and entitlement authorization matrices.
2. Run accessibility, keyboard, reduced-motion, responsive, and browser checks.
3. Test database backup restoration and migration recovery.
4. Test R2 lifecycle, secret rotation, Docker builds, and VPS startup.
5. Review logs for correlation IDs and accidental sensitive data.

### Friday — Full beta gate

1. Run the complete release checklist from clean environments.
2. Test self-paced and managed-cohort learner journeys end to end.
3. Test payment, progression, assessment, review, attendance, notifications, and certificates.
4. Confirm all 48 lessons completed manual content review.
5. Conduct the final cross-repository review and record product-owner sign-off.

## Best coding practices

- Evaluate eligibility from immutable evidence and versioned requirements.
- Generate opaque tokens with cryptographically secure randomness.
- Keep public verification responses minimal and privacy-reviewed.
- Make certificate generation idempotent and retry-safe.
- Preserve lifecycle history rather than mutating away earlier certificates.
- Test authorization as a permission matrix, including negative cases.
- Run recovery procedures from written runbooks, not memory.
- Treat accessibility and operability as release requirements.

## Don’ts

- Don’t issue a certificate automatically without required admin approval.
- Don’t use sequential IDs or personally meaningful verification tokens.
- Don’t expose email, payment, attendance, grades, or unconsented links publicly.
- Don’t overwrite or delete revoked certificate history.
- Don’t describe the certificate as accredited, academic, or regulator-approved.
- Don’t bypass a failing beta gate to preserve the date.
- Don’t rotate secrets without testing dependent services afterward.
- Don’t accept a recovery runbook that has not been executed successfully.

## Required evidence

- Eligibility tests for every requirement type and failure state.
- Approval authorization and duplicate-generation tests.
- Generated PDF, QR, verification, revocation, and reissue evidence.
- RBAC matrix results and accessibility report.
- Database restore, R2 lifecycle, webhook replay, job retry, secret rotation, and Docker/VPS test records.
- Signed beta-acceptance checklist.

## Exit gate

Week 6 is complete only when every beta requirement passes, both collaborators complete cross-review, and the product owner explicitly approves external beta.
