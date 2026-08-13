# Data Ownership Matrix

| Concern | Learner frontend | Backend/admin |
| --- | --- | --- |
| Marketing and learner presentation | Owns | Supplies public data |
| Session presentation | Reads API | Owns and persists |
| Users and credentials | Never persists | Owns |
| Roles and permissions | Mirrors capabilities | Owns and enforces |
| Content drafts and publication | Renders published data | Owns |
| Progress and quiz attempts | Submits events | Owns |
| Payments and entitlements | Starts checkout via API | Owns and verifies |
| Cohorts and attendance | Displays/checks in | Owns |
| Reviews and certificates | Displays/submits | Owns |
| Provider credentials | Never stores | Owns |

The frontend may cache API responses for presentation. It must never infer an
entitlement, permission, payment success, review result, or certificate status.

