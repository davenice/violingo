"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useChild } from "@/hooks/useChild";

export default function ParentLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { child, loading: childLoading, mode, enterParentMode, exitParentMode } = useChild();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && !childLoading && user && !child) router.replace("/onboarding");
  }, [authLoading, childLoading, user, child, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const ok = await enterParentMode(pin);
    setChecking(false);
    if (!ok) {
      setError("Incorrect PIN");
      setPin("");
    }
  }

  if (authLoading || childLoading || !user || !child) return null;

  if (mode !== "parent") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <h1 className="text-2xl font-semibold">Enter parent PIN</h1>
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
          <input
            autoFocus
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="w-32 rounded-lg border border-zinc-300 px-4 py-2 text-center text-2xl tracking-[0.5em]"
          />
          <button
            type="submit"
            disabled={checking || pin.length !== 4}
            className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Unlock
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 p-4">
        <h1 className="font-semibold">Parent settings</h1>
        <button
          onClick={() => {
            exitParentMode();
            router.push("/");
          }}
          className="text-sm text-zinc-600 underline"
        >
          Back to child view
        </button>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
