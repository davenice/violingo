# Violingo

A violin-practice companion for a child, gamified around a weekly streak: hit a
configurable number of practices per week to keep the streak, bank "lives" by
practicing extra, and work through parent-assigned sidequests (three stars
each). Progress syncs across devices via Firebase; a PIN-gated parent mode
holds the configuration.

Built with Next.js (App Router, TypeScript, Tailwind) and Firebase (Auth with
passwordless email-link sign-in + Firestore). The original static prototype
this replaced is preserved in `legacy-prototype/`.

## Setup

1. `npm install`
2. Copy `.env.local.example` to `.env.local` and fill in the Firebase web-app
   config (Firebase console → Project Settings → General → Your apps).
3. `npm run dev` — runs against the real Firebase project.

## Local development against emulators

No real Firebase project or network needed:

```bash
# Terminal 1 — emulators (needs Java 21+, e.g. brew install openjdk@21):
PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" npm run emulators

# Terminal 2 — dev server wired to the emulators via .env.emulator:
npm run dev:emulator

# Optional: seed a sample family into the emulator
npm run seed:emulator
```

Sign-in links aren't emailed by the emulator. Request one at
`http://localhost:3000/login`, then print it with:

```bash
node scripts/signin-link.mjs
```

Open the link in the same browser you requested it from. Note that emulator
data is in-memory — accounts and practice history reset when the emulators
restart.

## Tests

- `npm test` — unit tests for the pure domain logic in `lib/domain`
  (streak/lives/sidequest rules).
- `npm run test:rules` — Firestore security-rules tests (starts the emulator
  itself; needs Java 21+ on PATH).
- `node scripts/e2e-auth.mjs` — full browser E2E of the auth flow (login →
  onboarding → PIN gate). Needs the emulators and `npm run dev:emulator`
  running, plus `npx playwright install chromium` once.

## Weekly rollover (Cloud Function)

`functions/` holds a scheduled function (`weeklyRollover`, hourly) that
finalizes each fully-elapsed week per child: streak increment/break, life
banking from surplus, and automatic life-spending to save a missed week. It
reuses the exact `lib/domain` logic (esbuild inlines it at build time) and is
idempotent, with multi-week catch-up.

Deploying requires the Firebase project to be on the **Blaze plan** (Google
requires billing for any Cloud Functions deploy; actual cost at this usage is
zero). One-time setup, then deploy:

```bash
npx firebase login                     # authenticate the CLI
# upgrade the project to Blaze in the Firebase console first, then:
npx firebase deploy --only functions
```

## Layout

- `lib/domain/` — pure, framework-free game logic (dates, streak, lives,
  sidequests, PIN hashing) — unit-tested, shared with future Cloud
  Functions/native apps.
- `lib/firebase/` — client init, schema types, resilient doc subscription.
- `hooks/` — `useAuth` (Firebase Auth session), `useChild` (family data +
  child/parent mode switching).
- `app/` — routes: `/` child home, `/login`, `/onboarding`, `/parent/*`
  (PIN-gated settings).
- `firestore.rules` / `tests/` — security rules and their tests.
