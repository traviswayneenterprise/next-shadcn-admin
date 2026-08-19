# TWE Learning API Client

Versioned TypeScript types and a small fetch client generated from the authoritative
`docs/openapi/lms-v1.yaml` contract.

```ts
import { createLmsApiClient, LMS_API_VERSION } from "@traviswayneenterprise/lms-api-client";

const api = createLmsApiClient({ baseUrl: "https://admin.example.com/api/v1" });
const session = await api.request("/auth/session");
```

- Package version `1.x` targets `/api/v1`.
- The application supplies the backend/admin origin for each environment.
- Browser requests include credentials by default.
- Publish through GitHub Packages only after contract and compatibility checks pass.
