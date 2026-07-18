"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getWeekStart } from "@/lib/domain/dates";
import { hashPin } from "@/lib/domain/pin";
import { DEFAULT_REWARDS_BY_WEEKDAY } from "@/lib/firebase/schema";
import { useAuth } from "@/hooks/useAuth";
import { useChild } from "@/hooks/useChild";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { childId, loading: childLoading } = useChild();
  const [childName, setChildName] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!childLoading && childId) router.replace("/");
  }, [childLoading, childId, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!/^\d{4}$/.test(pin)) {
      setError("PIN must be exactly 4 digits.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const newChildId = crypto.randomUUID();
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const pinHash = await hashPin(pin, newChildId);
      const weekStart = getWeekStart(new Date(), timezone);

      await setDoc(doc(db, `children/${newChildId}`), {
        parentId: user.uid,
        name: childName,
        pinHash,
        timezone,
        createdAt: serverTimestamp(),
        settings: {
          weeklyTarget: 3,
          livesPerSurplus: 3,
          maxLives: 3,
          rewardsByWeekday: DEFAULT_REWARDS_BY_WEEKDAY,
        },
        streakState: {
          currentStreak: 0,
          longestStreak: 0,
          bankedLives: 0,
          surplusCounter: 0,
          lastEvaluatedWeekStart: weekStart,
          currentWeekPracticeCount: 0,
          lastWeekOutcome: null,
          updatedAt: serverTimestamp(),
        },
        activeSidequestId: null,
      });

      await setDoc(
        doc(db, `parents/${user.uid}`),
        {
          displayName: user.email,
          email: user.email,
          childId: newChildId,
          timezone,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Don't navigate here — navigating immediately races the ChildProvider's
      // Firestore listener, which hasn't yet observed the childId we just wrote.
      // The effect above redirects once `childId` is confirmed via the listener.
    } catch {
      setError("Something went wrong creating the profile. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Set up Violingo</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Child&apos;s name
          <input
            required
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Parent PIN
          <span className="font-normal text-zinc-500">
            4 digits — unlocks parent settings from the child view.
          </span>
          <input
            required
            inputMode="numeric"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="rounded-lg border border-zinc-300 px-4 py-2 font-normal tracking-widest"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          Start practicing
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </main>
  );
}
