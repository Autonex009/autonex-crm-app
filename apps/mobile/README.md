# Autonex DealBridge — mobile

A read-only companion to the web app, built around notifications: a deal moves,
the phone buzzes, one tap lands on the record. Creating and editing stay on the
web — there is not a form in here apart from sign-in.

Expo SDK 51, managed workflow. iOS and Android from one codebase, no native
directories, no eject.

## Running it

```bash
pnpm --filter @go-crm/mobile dev     # or `make mobile` from the workspace root
```

Then scan the QR code with Expo Go, or press `i` / `a` for a simulator.

`EXPO_PUBLIC_API_URL` points at the gateway. **On a physical device `localhost`
is the device itself**, so local development needs your machine's LAN IP:

```
EXPO_PUBLIC_API_URL=http://192.168.1.x:8080
```

Set it in the workspace `.env` (and in `eas.json` per build profile).

## What's in it

| Screen | |
|---|---|
| **Activity** | Home. Notifications, unread first. Tap routes to the record. |
| **Deals** | The board flattened into sections by stage, with per-stage totals. |
| **Leads** | Grouped by follow-up urgency — Overdue, Today, This week, Later. |
| **Companies** | Searchable, with each company's sites and their SPOC numbers. |
| **Settings** | Notification status, connection, sign out. |

Detail screens are read-only and exist for the escape hatches a laptop cannot
offer: call a contact, WhatsApp them, or open a plant site in Maps.

## Notifications

This is the feature the app exists for.

```
launch      ask permission -> get Expo push token -> POST /notifications/devices
deal moves  gateway records a notification -> POSTs to Expo -> APNs / FCM
tap         data.actionUrl -> routeFor() -> the right screen
```

Expo's push service rather than APNs and FCM directly, which is what keeps this
a managed build: no certificates, no `google-services.json`, no native module.

Details worth knowing:

- **Registration is idempotent and runs on every launch.** Expo can reissue a
  token after an app update or a restore onto a new handset, and the client
  cannot tell which case it is in, so the server reconciles.
- **The token identifies the installation, not the person.** Signing in on a
  shared handset takes over its notifications — otherwise the previous user
  keeps receiving them. Signing out detaches the device explicitly.
- **The badge follows the unread count from the API**, not from pushes, so
  clearing a notification on the web clears the badge here.
- **Permission is requested after sign-in**, never on the sign-in screen. Asking
  before someone knows what they would be agreeing to is how you get denied, and
  iOS only prompts once per install.
- **Simulators cannot receive push.** `Device.isDevice` is checked and Settings
  says so rather than failing opaquely.

## Design

Calm editorial. Three rules the UI holds to:

1. **Hierarchy from type scale, not boxes.** Lists are separated by hairlines and
   whitespace. Cards on a phone stack into a wall of identical rectangles; a
   34pt number over an 11pt label reads instantly.
2. **Colour only means status.** The indigo accent marks the one active thing.
   Everything else is the neutral ramp.
3. **Money is tabular**, so a column of amounts aligns, and grouped `en-IN`
   (₹24,50,000 — lakhs, not millions).

Light and dark both follow the OS setting. There is no in-app theme toggle: the
phone already has one where people know to look.

No icon font — the tab indicator is a dot that grows and takes the accent colour
when active. A vector icon package would be ~500 KB of fonts for five shapes.

## Structure

```
App.tsx              providers; index.js registers it
src/
  theme/             semantic tokens over @go-crm/design-tokens, light + dark
  lib/
    api.ts           @go-crm/api-client in token mode
    auth.ts          session store + Keychain-backed refresh token
    push.ts          permission, registration, badge
    usePush.ts       listeners and registration lifecycle
    queries.ts       react-query hooks; shapes mirror docs/API.md exactly
    format.ts        money, dates, relative time
  ui/                the whole component vocabulary, two files
  screens/
  navigation/        tabs + stack, and routeFor for notification taps
```

The API client, types and design tokens are shared with the web app through the
workspace — including the single-flight token refresh, which is a correctness
requirement rather than an optimisation. See the root README.

## Building

```bash
npx eas build --profile preview --platform android    # internal APK
npx eas build --profile production --platform all
```

The first build needs `eas init` to create the project and write
`extra.eas.projectId` into `app.json`. **Push tokens cannot be minted in a
production build without that id** — Expo's error for a missing one is opaque.

### pnpm notes

Two things in this app exist because of pnpm's strict layout:

- `index.js` is a local entry point rather than expo's default
  `node_modules/expo/AppEntry.js`, which under pnpm sits inside the `.pnpm`
  store and reaches back out with a relative path that resolves wrongly.
- `metro.config.js` deliberately does **not** set `disableHierarchicalLookup`,
  which the Expo monorepo guide recommends. That advice assumes a flat
  `node_modules`; under pnpm each package's dependencies live beside it inside
  `.pnpm/`, reachable only by walking up from the importing file. Disabling it
  makes `expo-modules-core` unresolvable from `expo`.
- `@babel/runtime` is an explicit dependency for the same reason.

## Not done yet

- **SSO.** The gateway's flow ends in a browser redirect to the web origin with
  the token in a URL fragment, which a native app cannot receive. It needs
  `expo-auth-session` and a custom-scheme callback server-side.
- **Offline.** react-query caches in memory only, so a cold start with no
  connection shows empty states. A persister would fix it.
- **Tests.** Typecheck and a Metro bundle for both platforms are the current
  gates. The shared API client it sits on is covered at ~93%.
- **Icons and splash.** `app.json` sets colours but ships no artwork yet.
