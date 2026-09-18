# autonex-crm-app

The frontend for Autonex DealBridge CRM: an Astro + React web app and a React
Native (Expo) mobile app, sharing one API client, one type layer and one set of
design tokens.

The backend lives in **`autonex-crm-api`**. The two repositories are connected by
configuration only — there is no shared code and no build-time dependency.

```
apps/web    ──┐
              ├──► @go-crm/api-client ──► apidealbridge.autonexai360.com
apps/mobile ──┘                                (autonex-crm-api)
```

## Layout

```
apps/
  web/        Astro 4 (hybrid output) + React 18 island SPA mounted at /app
  mobile/     Expo 51 / React Native 0.74 — scaffold, not yet built out
packages/
  api-client/ The only way this codebase talks to the API: transport, error
              normalisation, single-flight token refresh, both auth modes
  types/      Zod schemas and TypeScript types mirroring the API contract
  design-tokens/ Tailwind preset and raw tokens shared by both apps
docs/
  DEPLOY.md
  api-contract/  Pinned copy of the API's docs/API.md, diffed by CI
```

`apps/web` is organised by feature: each domain folder under `src/app/` owns its
`api.ts` (one `BASE = "/api/v1/<domain>"` constant), its schemas and its
components. Routes live in `src/app/routes/`, shared UI in `src/app/ui/`.

## Stack

pnpm workspaces + Turborepo · Astro · React 18 · React Router v6 · TailwindCSS ·
TanStack Query · Zustand · React Hook Form + Zod · dnd-kit · Expo / React Native

## Getting started

```bash
cp .env.example .env         # PUBLIC_API_URL defaults to the local gateway
pnpm install
pnpm dev                     # web on :4321, mobile via Expo
```

Run the API alongside it, from the `autonex-crm-api` checkout:

```bash
cd ../autonex-crm-api && make run     # :8080
```

Two terminals, two clones. Scripts: `pnpm dev:web`, `pnpm dev:mobile`,
`pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm format`.

## Connecting to the backend

| Variable | Set on | Value |
|---|---|---|
| `PUBLIC_API_URL` | this repo (web) | `https://apidealbridge.autonexai360.com` |
| `EXPO_PUBLIC_API_URL` | this repo (mobile) | `https://apidealbridge.autonexai360.com` |
| `WEB_APP_URL` | `autonex-crm-api` | `https://dealbridge.autonexai360.com` |

`PUBLIC_API_URL` is inlined into the client bundle by Vite **at build time**, so
changing it requires a redeploy rather than a restart. The Docker build fails
outright when it is unset.

**No backend secret belongs in this repo.** Anything prefixed `PUBLIC_` or
`EXPO_PUBLIC_` ships to the browser and to app stores.

Both apps must stay under `autonexai360.com` alongside the API: the refresh
cookie is `SameSite=Lax`, so a different registrable domain means it is silently
never sent and every session ends after 15 minutes. See `docs/AUTH.md` in the API
repo.

## The API client

Every call goes through `@go-crm/api-client`. It is deliberately
platform-agnostic — base URL, session storage and auth mode are injected — so the
web app and the native app share one implementation of the part that is easy to
get wrong.

```ts
// apps/web/src/app/lib/client.ts — cookie mode
createApiClient({
  baseUrl: API_URL,
  mode: "cookie",
  session: {
    getAccessToken: () => useAuthStore.getState().token,
    setSession: (t, u) => useAuthStore.getState().setSession(t, u),
    clearSession: () => useAuthStore.getState().clear(),
  },
});
```

Feature modules never see this — they import `apiFetch` from
`src/app/lib/api.ts`, which re-exports the configured client.

### Adding the mobile client

Mobile uses **token mode**: React Native has no dependable cookie jar and
`SameSite` means nothing off-browser, so the refresh token is returned in the
response body and the app stores it itself.

```ts
import * as SecureStore from "expo-secure-store";
import { createApiClient } from "@go-crm/api-client";

export const api = createApiClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  mode: "token",
  // Secure storage, never AsyncStorage — this is the long-lived credential.
  refreshTokenStore: {
    get: () => SecureStore.getItemAsync("refresh"),
    set: (t) => SecureStore.setItemAsync("refresh", t),
    clear: () => SecureStore.deleteItemAsync("refresh"),
  },
  session: {
    /* whatever store the app uses */
  },
});
```

The backend already supports this (`X-Auth-Mode: token`). SSO does not yet work
on native — it needs `expo-auth-session` and a custom-scheme callback the gateway
does not implement.

### Why the refresh is single-flight

Refresh tokens are single-use, and the gateway reads a replayed one as theft and
**kills every session for that user**. So N concurrent 401s must produce exactly
one `/refresh` call. That invariant is enforced inside the client and covered by
`packages/api-client/src/client.test.ts`. Do not reimplement the refresh
elsewhere.

## Testing

```bash
pnpm test                  # all packages
pnpm --filter @go-crm/api-client coverage
```

`packages/api-client` is covered at ~93%, including the single-flight guarantee,
both auth modes and the transport-failure path.

`apps/web` has **no tests yet** — the Astro build (`pnpm build`) type-checks all
131 files and is currently the only automated gate on it. Adding Playwright over
the critical flows (login, lead → convert → deal, quote → invoice, kanban drag,
delivery import) is the highest-value next step.

`pnpm lint` checks `packages/` only. The files under `apps/` predate any Prettier
config and 75 of them are unformatted; `pnpm format:all` fixes them, but it is
worth doing as its own commit so it does not bury a real diff.

## The API contract

`autonex-crm-api/docs/API.md` is the contract of record, and `packages/types` is
hand-written against it. There is no compiler between the repositories, so CI
diffs `docs/api-contract/API.md` against the live file and fails when it changes.
See `docs/api-contract/README.md`.

Enable it by adding an `API_REPO_READ_TOKEN` secret with read access to the API
repo; without it the job skips rather than failing.
