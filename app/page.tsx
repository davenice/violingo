"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useChild } from "@/hooks/useChild";
import { usePracticeWeek } from "@/hooks/usePracticeWeek";
import { useSidequests } from "@/hooks/useSidequests";
import { getDateKey, getWeekDates, weekStartOfKey } from "@/lib/domain/dates";
import { getActiveSidequestId } from "@/lib/domain/sidequests";
import { tagSidequestForDay, togglePracticeDay } from "@/lib/firebase/practice";
import { StreakBadge } from "@/components/child/StreakBadge";
import { LivesTracker } from "@/components/child/LivesTracker";
import { WeekPath } from "@/components/child/WeekPath";
import { SidequestCard } from "@/components/child/SidequestCard";
import { LastPrize } from "@/components/child/LastPrize";
import { Mascot } from "@/components/child/Mascot";
import { Toast, useToast } from "@/components/child/Toast";

export default function ChildHomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { child, childId, loading: childLoading } = useChild();
  const { toast, showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const timezone = child?.timezone ?? "UTC";
  const todayKey = useMemo(() => getDateKey(new Date(), timezone), [timezone]);
  const weekStart = weekStartOfKey(todayKey);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const weekLog = usePracticeWeek(childId, weekStart);
  const sidequests = useSidequests(childId);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!authLoading && !childLoading && user && !child) router.replace("/onboarding");
  }, [authLoading, childLoading, user, child, router]);

  if (authLoading || childLoading || !user || !child) return null;

  const practicedDates = new Set(
    [...weekLog.entries()].filter(([, e]) => e.practiced).map(([date]) => date),
  );
  const todayEntry = weekLog.get(todayKey);
  const todayPracticed = todayEntry?.practiced ?? false;
  const todayTaggedSidequestId = todayEntry?.sidequestStarEarned
    ? (todayEntry.sidequestId ?? null)
    : null;

  async function handleToggle(date: string) {
    setBusy(true);
    try {
      const result = await togglePracticeDay(childId!, date);
      if (result.targetJustHit) {
        showToast("🎉 Weekly target hit — streak safe!");
      } else if (result.practiced && result.reward) {
        showToast(`You revealed: ${result.reward.label}!`);
      } else if (result.sidequestStarReverted) {
        showToast("Practice unmarked — sidequest star returned");
      }
    } catch {
      showToast("Couldn't save that — try again");
    } finally {
      setBusy(false);
    }
  }

  async function handleTagToday(sidequestId: string) {
    setBusy(true);
    try {
      // Who becomes active if this star completes the quest: the next
      // incomplete quest in order, per the currently subscribed list.
      const remaining = sidequests.filter((sq) => sq.id !== sidequestId);
      const nextActiveId = getActiveSidequestId(
        remaining.map((sq) => ({ ...sq, completedAt: sq.completedAt ?? null })),
      );
      const result = await tagSidequestForDay(childId!, todayKey, sidequestId, nextActiveId);
      if (result.action === "star") {
        showToast(result.completed ? "🏅 Sidequest complete! New quest unlocked" : "⭐ Sidequest star earned!");
      } else if (result.action === "untagged") {
        showToast("Sidequest star removed");
      } else {
        showToast(result.reason);
      }
    } catch {
      showToast("Couldn't save that — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-4 bg-cream p-4 pb-16">
      <header className="flex w-full max-w-md items-center justify-between">
        <div className="flex items-center gap-2">
          <Mascot size={56} />
          <div>
            <h1 className="text-2xl font-bold">Hi {child.name}!</h1>
            <p className="text-sm text-zinc-500">Keep the music going 🎻</p>
          </div>
        </div>
        <div className="flex gap-2">
          <StreakBadge streak={child.streakState.currentStreak} />
          <LivesTracker
            bankedLives={child.streakState.bankedLives}
            maxLives={child.settings.maxLives}
            surplus={child.streakState.surplusCounter}
            surplusPerLife={child.settings.livesPerSurplus}
          />
        </div>
      </header>

      <WeekPath
        weekDates={weekDates}
        practicedDates={practicedDates}
        todayKey={todayKey}
        target={child.settings.weeklyTarget}
        rewardsByWeekday={child.settings.rewardsByWeekday}
        onToggle={handleToggle}
        busy={busy}
      />

      <SidequestCard
        sidequests={sidequests}
        activeSidequestId={child.activeSidequestId}
        todayPracticed={todayPracticed}
        todayTaggedSidequestId={todayTaggedSidequestId}
        onTagToday={handleTagToday}
        busy={busy}
      />

      <LastPrize
        practicedDates={weekDates.filter((d) => practicedDates.has(d))}
        rewardsByWeekday={child.settings.rewardsByWeekday}
      />

      <Link href="/parent" className="mt-2 text-sm text-plum-600 underline">
        Parent settings
      </Link>

      <Toast message={toast} />
    </main>
  );
}
