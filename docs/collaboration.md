# Collaboration Workflow

## Roles

Stable primary areas are assigned after architecture review. Until then, every
issue explicitly names one primary implementer and one reviewer.

The product owner resolves blocked decisions and must approve architecture,
schema, authentication, OpenAPI, payment, RBAC, and certificate changes.

## Feature sequence

1. Agree issue acceptance criteria or merge an ADR.
2. Merge backend domain and OpenAPI changes.
3. Publish an exact generated-client version.
4. Merge frontend integration using that version.
5. Perform joint end-to-end review.
6. Activate the feature flag only after acceptance passes.

Branches are short-lived and owned by one implementer. Collaborators do not
share mutable working branches.

