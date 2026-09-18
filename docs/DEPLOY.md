# Deploying the web app to Railway

One Railway service, built from `Dockerfile` at the repo root: Astro in `hybrid`
output on the `@astrojs/node` standalone adapter.

The API deploys separately from `autonex-crm-api`. Keep both services in the
**same Railway project and region**.

The mobile app does not deploy here — it ships through EAS (see below).

---

## 1. Create the service

```bash
npm i -g @railway/cli
railway login
railway add             # create an empty service, name it "web"
```

In the Railway dashboard, on the **web** service:

- **Settings → Source**: this repository
- **Settings → Config-as-code → Railway Config File**: `railway.json`
- **Settings → Networking**: attach `dealbridge.autonexai360.com`
- **Settings → Region**: the same region as the `api` service. The browser talks
  to both, and they should not be on different continents.

### Variables

```
PUBLIC_API_URL=https://apidealbridge.autonexai360.com
NODE_ENV=production
```

That is the entire list. **No backend secret belongs here** — not
`DATABASE_URL`, not `JWT_SECRET`, not an OAuth client secret. Anything prefixed
`PUBLIC_` is compiled into a bundle that ships to every visitor.

`PUBLIC_API_URL` is inlined by Vite **at build time**. Railway forwards a service
variable into a Dockerfile build only when the name is declared with `ARG` in
that stage; `Dockerfile` declares it, so setting the service variable is enough.
The build fails with an explicit error when it is missing, rather than shipping a
bundle that points at localhost. **Changing it later needs a redeploy, not a
restart.**

## 2. Point the API back at this app

On the **api** service, set:

```
WEB_APP_URL=https://dealbridge.autonexai360.com
```

It is compared as an exact string for CORS and used as the SSO redirect target.
A scheme mismatch, a `www.` prefix or a trailing slash breaks both.

Both hosts must stay under `autonexai360.com`. The refresh cookie is
`SameSite=Lax`, so moving either service to a different registrable domain means
the cookie is silently never sent and every session dies after 15 minutes. See
the API repo's `docs/AUTH.md`.

## 3. Verify

```bash
curl -I https://dealbridge.autonexai360.com/app/login    # -> 200, SSR shell
curl -I https://dealbridge.autonexai360.com/             # -> 200, prerendered
```

Then sign in and confirm the network tab shows calls going to
`apidealbridge.autonexai360.com` with an `Authorization` header and no CORS
errors.

The regression that matters most after any domain or deployment change: set
`JWT_ACCESS_TTL=30s` on the API temporarily, sign in here, wait a minute and
click something. Staying signed in proves the refresh cookie still crosses
between the two domains.

## Mobile (EAS)

```bash
pnpm --filter @go-crm/mobile exec eas build --profile preview --platform android
```

`EXPO_PUBLIC_API_URL` is read at build time by EAS; set it per profile in
`apps/mobile/eas.json` or as an EAS secret. On a physical device `localhost` is
the device itself, so local development against a laptop gateway needs the LAN IP
(`http://192.168.x.x:8080`).

---

## What makes the build and the runtime fast

- The Dockerfile is multi-stage and ordered so the install layer only
  invalidates when a `package.json` changes, not on every source edit.
- The install is filtered to `@go-crm/web...`, so the Expo/React Native tree in
  `apps/mobile` is never downloaded for a web build.
- A second, production-only install for the runtime image — no TypeScript, no
  Astro CLI, no `@astrojs/check` in the running container.
- `output: "hybrid"` — marketing pages are prerendered and served as static files
  by the standalone server; only `/app/*` is SSR.

### The next win, when you need it

The SPA ships as one chunk: `AppRoot` is ~670 kB raw / ~195 kB gzipped, so every
`/app/*` visitor downloads leads, deals, quotes, invoices and dashboards before
seeing the login form. Splitting the route components in `apps/web/src/app/routes`
behind `React.lazy` + `Suspense` is a contained change and the largest
first-paint improvement available.

`mermaid` (~169 kB gzipped) and `katex` (~78 kB) are already split into their own
chunks by Vite, but check they are only pulled in on the routes that render
diagrams.

### Optional: BuildKit cache mounts

Railway's Metal builder accepts them only in this exact form, with the service id
**hardcoded** (the flag does no variable expansion):

```dockerfile
RUN --mount=type=cache,id=s/<web-service-id>-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter @go-crm/web...
```

That hardcoding is why it is not the default: it pins the Dockerfile to one
Railway project and breaks plain `docker build` reuse.
