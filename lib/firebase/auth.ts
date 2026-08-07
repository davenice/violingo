import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithCustomToken,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "./client";

const EMAIL_STORAGE_KEY = "violingo-signin-email";

export async function sendLoginLink(email: string): Promise<void> {
  await sendSignInLinkToEmail(auth, email, {
    url: `${window.location.origin}/login`,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(EMAIL_STORAGE_KEY, email);
}

export function isLoginLink(url: string): boolean {
  return isSignInWithEmailLink(auth, url);
}

/** Throws with message "MISSING_EMAIL_FOR_SIGN_IN" if opened on a different device with no stored email. */
export async function completeLoginWithLink(url: string, fallbackEmail?: string): Promise<User> {
  const email = window.localStorage.getItem(EMAIL_STORAGE_KEY) ?? fallbackEmail;
  if (!email) {
    throw new Error("MISSING_EMAIL_FOR_SIGN_IN");
  }
  const credential = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem(EMAIL_STORAGE_KEY);
  return credential.user;
}

/** Mints a short code (from an already-signed-in session) that a separate storage context — e.g. an installed iOS PWA — can redeem via {@link signInWithCode}. */
export async function createSignInCode(): Promise<{ code: string; expiresInSeconds: number }> {
  const call = httpsCallable<void, { code: string; expiresInSeconds: number }>(
    functions,
    "createSignInCode",
  );
  const { data } = await call();
  return data;
}

export async function signInWithCode(code: string, email: string): Promise<User> {
  const call = httpsCallable<{ code: string; email: string }, { token: string }>(
    functions,
    "redeemSignInCode",
  );
  const { data } = await call({ code, email });
  const credential = await signInWithCustomToken(auth, data.token);
  return credential.user;
}

export function subscribeToAuthState(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
