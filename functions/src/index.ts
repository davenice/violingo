import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { rolloverAllChildren } from "./rollover";
import { resolveSignInCode, storeSignInCode } from "./signInCode";

initializeApp();

// Called from an already-signed-in session to mint a code another storage
// context for the same user can redeem below.
export const createSignInCode = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before requesting a code.");
  }
  const email = request.auth.token.email;
  if (!email) {
    throw new HttpsError("failed-precondition", "Your account has no email on file.");
  }
  return storeSignInCode(getFirestore(), request.auth.uid, email);
});

export const redeemSignInCode = onCall(async (request) => {
  const code = request.data?.code;
  const email = request.data?.email;
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    throw new HttpsError("invalid-argument", "Enter the 6-digit code.");
  }
  if (typeof email !== "string" || !email.trim()) {
    throw new HttpsError("invalid-argument", "Enter the email the code was generated for.");
  }

  let uid: string;
  try {
    uid = await resolveSignInCode(getFirestore(), code, email);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "";
    if (reason === "LOCKED") {
      throw new HttpsError(
        "resource-exhausted",
        "Too many incorrect attempts — that code has been cancelled. Generate a new one in Settings and try again.",
      );
    }
    if (reason === "EXPIRED") {
      throw new HttpsError("deadline-exceeded", "That code has expired.");
    }
    if (reason === "EMAIL_MISMATCH") {
      throw new HttpsError("permission-denied", "That code doesn't match this email.");
    }
    throw new HttpsError("not-found", "That code is invalid or has expired.");
  }

  return { token: await getAuth().createCustomToken(uid) };
});

// Hourly is cheap and catches each family's local Monday-midnight promptly
// regardless of timezone; rolloverChild is idempotent so extra runs are no-ops.
export const weeklyRollover = onSchedule("every 1 hours", async () => {
  const results = await rolloverAllChildren(getFirestore(), new Date());
  const finalized = results.filter((r) => r.weeksFinalized > 0);
  logger.info("weeklyRollover complete", {
    children: results.length,
    childrenFinalized: finalized.length,
    details: finalized,
  });
});
