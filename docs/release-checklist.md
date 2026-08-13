# External Beta Release Checklist

- [ ] All 48 imported lessons have been manually reviewed and published.
- [ ] Both repositories build, test, deploy, and start from their Docker images.
- [ ] Shared-domain Google and email/password authentication passes.
- [ ] Learner frontend contains no Prisma access or provider secrets.
- [ ] NGN checkout, refund, duplicate webhook, mismatch, and chargeback pass.
- [ ] Self-paced and cohort entitlements behave independently.
- [ ] Progression, cooldowns, submissions, reviews, and eligibility pass.
- [ ] Cohort scheduling, check-in, attendance, deadlines, and reminders pass.
- [ ] In-app, email, and WhatsApp delivery and failure handling pass.
- [ ] RBAC denies every unauthorized sensitive action in the test matrix.
- [ ] Certificate approval, verification, revocation, and reissue pass.
- [ ] OpenAPI implementation and generated-client compatibility pass in CI.
- [ ] Restore, R2 lifecycle, webhook replay, job retry, and rotation are tested.
- [ ] Accessibility and mobile learner flows pass.
- [ ] Both collaborators complete cross-repository review.
- [ ] Product owner signs off external beta.

