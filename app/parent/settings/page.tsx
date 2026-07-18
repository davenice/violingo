"use client";

import Link from "next/link";
import { useChild } from "@/hooks/useChild";
import { Stepper } from "@/components/parent/Stepper";
import { RewardsEditor } from "@/components/parent/RewardsEditor";
import { Toast, useToast } from "@/components/child/Toast";
import { updateLivesConfig, updateWeeklyTarget } from "@/lib/firebase/parentActions";

export default function ParentSettingsPage() {
  const { child, childId } = useChild();
  const { toast, showToast } = useToast();
  if (!child || !childId) return null;

  async function save(action: () => Promise<void>) {
    try {
      await action();
      showToast("Saved");
    } catch {
      showToast("Couldn't save — try again");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Link href="/parent" className="text-sm text-violet-600 underline">
        ← Back
      </Link>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Weekly practice</h2>
        <Stepper
          label="Practices per week"
          hint="How many practices keep the streak alive"
          value={child.settings.weeklyTarget}
          min={1}
          max={7}
          onChange={(v) => save(() => updateWeeklyTarget(childId, v))}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Lives</h2>
        <Stepper
          label="Extra practices per life"
          hint="Practices beyond the weekly target needed to bank one life"
          value={child.settings.livesPerSurplus}
          min={1}
          max={7}
          onChange={(v) => save(() => updateLivesConfig(childId, v, child.settings.maxLives))}
        />
        <Stepper
          label="Maximum banked lives"
          hint="A life saves the streak when a week's target is missed"
          value={child.settings.maxLives}
          min={1}
          max={5}
          onChange={(v) => save(() => updateLivesConfig(childId, child.settings.livesPerSurplus, v))}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Rewards by weekday</h2>
        <RewardsEditor
          childId={childId}
          rewardsByWeekday={child.settings.rewardsByWeekday}
          onSaved={showToast}
        />
      </section>

      <Toast message={toast} />
    </div>
  );
}
