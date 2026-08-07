import { randomInt, createHash } from "node:crypto";
import type { Firestore } from "firebase-admin/firestore";

const CODE_TTL_MS = 5 * 60 * 1000;

// A 6-digit code is only ~20 bits, so the redeem path must cap guessing.
// Attempts are counted per email (the one value an attacker is forced to
// repeat, since a token is only minted when the supplied email matches the
// code's stored email), not per code — a wrong code hits a nonexistent
// document, so there's nothing on the code itself to count.
const MAX_FAILED_ATTEMPTS = 5;

function hashSignInCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function attemptDocId(email: string): string {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

function generateSignInCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

interface AttemptDoc {
  failedAttempts: number;
  windowExpiresAt: FirebaseFirestore.Timestamp;
}

type Verdict =
  | { ok: true; uid: string }
  | { ok: false; reason: "NOT_FOUND" | "EXPIRED" | "EMAIL_MISMATCH" | "LOCKED" };

/**
 * Mints a short-lived code that resolves to `uid` and stores only its hash,
 * keyed by that hash — so a lookup requires knowing the code, not scanning
 * for it. Lets an already-signed-in session (e.g. Safari, after tapping the
 * email link) hand off to a separate storage context (e.g. an installed iOS
 * PWA) that can't share that session. Requiring the account's email at
 * redemption (below) makes the code alone insufficient to sign in — a
 * blind guesser also needs to already know which email to pair it with.
 * Minting also clears any failed-attempt lock on that email, so the user who
 * tripped the guess limit gets a clean slate as soon as they request a code.
 */
export async function storeSignInCode(
  db: Firestore,
  uid: string,
  email: string,
): Promise<{ code: string; expiresInSeconds: number }> {
  const code = generateSignInCode();
  const normalizedEmail = normalizeEmail(email);
  const batch = db.batch();
  batch.set(db.collection("signInCodes").doc(hashSignInCode(code)), {
    uid,
    email: normalizedEmail,
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  batch.delete(db.collection("signInAttempts").doc(attemptDocId(normalizedEmail)));
  await batch.commit();
  return { code, expiresInSeconds: CODE_TTL_MS / 1000 };
}

/**
 * Redeems a code, returning the uid it resolved to. Throws "NOT_FOUND",
 * "EXPIRED", "EMAIL_MISMATCH", or "LOCKED".
 *
 * Wrong code/email guesses are counted per email; on the MAX_FAILED_ATTEMPTS-th
 * failure the email's outstanding code is deleted and further redemption is
 * blocked ("LOCKED") until a new code is minted. This caps a brute-forcer at
 * MAX_FAILED_ATTEMPTS guesses out of 1,000,000 per issued code. An expired
 * code is treated as benign cleanup, not a failed attempt.
 */
export async function resolveSignInCode(db: Firestore, code: string, email: string): Promise<string> {
  const normalizedEmail = normalizeEmail(email);
  const codeRef = db.collection("signInCodes").doc(hashSignInCode(code));
  const attemptRef = db.collection("signInAttempts").doc(attemptDocId(normalizedEmail));
  const codesForEmail = db.collection("signInCodes").where("email", "==", normalizedEmail);

  // The transaction *returns* its verdict rather than throwing it: throwing
  // from a runTransaction callback aborts the transaction, which would roll
  // back the very attempt-counter write the lockout depends on. Failures are
  // raised after the transaction has committed.
  const result = await db.runTransaction<Verdict>(async (tx) => {
    const now = Date.now();

    // All reads must precede all writes within the transaction.
    const attemptSnap = await tx.get(attemptRef);
    const codeSnap = await tx.get(codeRef);

    let failedAttempts = 0;
    if (attemptSnap.exists) {
      const attempt = attemptSnap.data() as AttemptDoc;
      if (attempt.windowExpiresAt.toMillis() > now) {
        failedAttempts = attempt.failedAttempts;
      }
    }
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      return { ok: false, reason: "LOCKED" };
    }

    // Classify the attempt from the (already-read) snapshots.
    let outcome: "OK" | "NOT_FOUND" | "EXPIRED" | "EMAIL_MISMATCH";
    let uid = "";
    if (!codeSnap.exists) {
      outcome = "NOT_FOUND";
    } else {
      const data = codeSnap.data() as {
        uid: string;
        email: string;
        expiresAt: FirebaseFirestore.Timestamp;
      };
      if (data.expiresAt.toMillis() < now) {
        outcome = "EXPIRED";
      } else if (data.email.toLowerCase() !== normalizedEmail) {
        outcome = "EMAIL_MISMATCH";
      } else {
        outcome = "OK";
        uid = data.uid;
      }
    }

    if (outcome === "OK") {
      tx.delete(codeRef);
      tx.delete(attemptRef);
      return { ok: true, uid };
    }

    if (outcome === "EXPIRED") {
      tx.delete(codeRef);
      return { ok: false, reason: "EXPIRED" };
    }

    // Wrong code or wrong email — burn an attempt against this email.
    const nextFailed = failedAttempts + 1;
    if (nextFailed >= MAX_FAILED_ATTEMPTS) {
      // Too many — cancel any live code issued for this email so the whole
      // handoff must be restarted, and keep the email locked for the window.
      // This read must happen before the writes below.
      const outstanding = await tx.get(codesForEmail);
      outstanding.forEach((doc) => tx.delete(doc.ref));
      tx.set(attemptRef, {
        failedAttempts: nextFailed,
        windowExpiresAt: new Date(now + CODE_TTL_MS),
      });
      return { ok: false, reason: "LOCKED" };
    }

    tx.set(attemptRef, {
      failedAttempts: nextFailed,
      windowExpiresAt: new Date(now + CODE_TTL_MS),
    });
    return { ok: false, reason: outcome };
  });

  if (!result.ok) throw new Error(result.reason);
  return result.uid;
}
