"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { completeLoginWithLink, isLoginLink, sendLoginLink } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";

type Status = "idle" | "sending" | "sent" | "completing" | "error";

const emptySubscribe = () => () => {};

/**
 * Whether the current URL is a Firebase sign-in link. Read via
 * useSyncExternalStore so the server render (which can't know the URL's
 * query params) and the client render don't produce a hydration mismatch.
 */
function useIsLoginLink(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => isLoginLink(window.location.href),
    () => false,
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const onLoginLink = useIsLoginLink();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsEmail, setNeedsEmail] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!isLoginLink(window.location.href)) return;
    completeLoginWithLink(window.location.href)
      .then(() => router.replace("/"))
      .catch((err: Error) => {
        if (err.message === "MISSING_EMAIL_FOR_SIGN_IN") {
          setNeedsEmail(true);
        } else {
          setError("That sign-in link is invalid or has expired. Request a new one below.");
          setStatus("error");
        }
      });
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (needsEmail) {
      setStatus("completing");
      try {
        await completeLoginWithLink(window.location.href, email);
        router.replace("/");
      } catch {
        setError("Couldn't sign you in with that email. Request a new link below.");
        setNeedsEmail(false);
        setStatus("error");
      }
      return;
    }

    setStatus("sending");
    try {
      await sendLoginLink(email);
      setStatus("sent");
    } catch {
      setError("Couldn't send the sign-in link. Check the email and try again.");
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="max-w-sm text-zinc-600">
          We sent a sign-in link to <strong>{email}</strong>. Open it on this device to finish
          signing in.
        </p>
      </main>
    );
  }

  // On a sign-in link, the effect above is completing authentication — show a
  // holding message instead of the form unless it needs the email confirmed
  // (link opened on a different device) or it failed.
  if (onLoginLink && !needsEmail && status !== "error") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Signing you in…</h1>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">
        {needsEmail ? "Confirm your email" : "Sign in to Violingo"}
      </h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-zinc-300 px-4 py-2"
        />
        <button
          type="submit"
          disabled={status === "sending" || status === "completing"}
          className="rounded-lg bg-plum-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {needsEmail ? "Confirm and sign in" : "Email me a sign-in link"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
