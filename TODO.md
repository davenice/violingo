# TODO

## Test the sign-in code flow (`functions/src/signInCode.ts`)

Added 7 Aug 2026. This module shipped with **zero** test coverage and two bugs
made it to production that a test would have caught immediately:

1. **Attempt counter never incremented.** `tx.set(attemptRef, …)` was followed by
   `throw` inside the `runTransaction` callback. Throwing aborts the transaction
   and rolls back buffered writes, so `failedAttempts` stayed at 0 and the
   lockout could never fire. Fixed by returning a verdict and throwing after the
   transaction commits.
2. **Expired codes never deleted.** Same root cause — the `tx.delete(codeRef)` on
   the `EXPIRED` path was rolled back by the throw that followed it.

Both are silent failures: the happy path kept working, so manual testing didn't
reveal them. That's exactly the shape of bug worth automating.

### Harness

Use the Firestore emulator, mirroring `tests/firestore.rules.test.ts` and the
existing `npm run test:rules` script (`firebase emulators:exec --only firestore`).
`resolveSignInCode`/`storeSignInCode` take a `Firestore` as their first argument
specifically so a test can pass an emulator-backed instance — no mocking needed.
Note the emulator needs Java on PATH (see the Firebase dev-workflow notes).

### Cases to cover

**Happy path**
- Store a code, redeem it with the matching email → returns the right uid.
- Redeeming consumes the code: a second redeem of the same code fails.
- Email matching is case/whitespace-insensitive (`  Dave@Example.com  ` matches
  a code stored for `dave@example.com`).

**Attempt limiting** — the regression that motivated this
- Each wrong code with the correct email increments `failedAttempts`; assert the
  `signInAttempts` doc actually persists between calls (this is what was broken).
- The 5th failure returns `LOCKED` **and** deletes the live code for that email —
  assert the *correct* code no longer works afterwards.
- A wrong email against a valid code also burns an attempt.
- Once locked, further attempts stay `LOCKED` even with the correct code+email.
- `storeSignInCode` clears the lock, so generating a new code frees a locked-out
  user.
- Attempts are scoped per email — locking out `a@x.com` must not affect
  `b@x.com`.

**Expiry**
- A code past `CODE_TTL_MS` returns `EXPIRED` and the doc is deleted (assert the
  deletion, per bug 2 — needs fake timers or an injected clock, since the TTL is
  computed from `Date.now()`).
- An expired code does **not** burn an attempt.

**Wiring** (`functions/src/index.ts`)
- Each thrown reason maps to its intended `HttpsError` code, especially
  `LOCKED` → `resource-exhausted`, since `app/login/page.tsx` keys the
  user-facing lockout message off that exact code string.

### Also worth doing

- Consider injecting a clock into `signInCode.ts` instead of calling `Date.now()`
  directly — it makes every expiry/window case testable without fake timers.
- No test currently covers the callable wrapper end to end; `firebase-functions-test`
  would be the tool if that's wanted, but testing the two exported helpers
  directly gets most of the value for far less setup.
