# Events and Webhooks

All inbound provider events are persisted before processing and deduplicated by
provider event ID. All jobs and retryable writes use idempotency keys.

| Source | Events | Authority check |
| --- | --- | --- |
| Paystack | charge success, refund, dispute | Signature then transaction verify |
| Resend | delivered, bounced, complained | Provider signature |
| Meta | accepted, delivered, read, failed | Verification token and signature |
| Trigger.dev | job lifecycle | Signed platform callback |

Correlation IDs flow from the incoming request through audit, webhook, job, and
delivery records. Provider payloads are redacted before appearing in staff views.

