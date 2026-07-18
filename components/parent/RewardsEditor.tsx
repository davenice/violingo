"use client";

import { useState } from "react";
import type { RewardEntry } from "@/lib/firebase/schema";
import { updateRewards } from "@/lib/firebase/parentActions";

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

interface RewardsEditorProps {
  childId: string;
  rewardsByWeekday: Record<string, RewardEntry>;
  onSaved: (message: string) => void;
}

export function RewardsEditor({ childId, rewardsByWeekday, onSaved }: RewardsEditorProps) {
  const [rewards, setRewards] = useState<Record<string, RewardEntry>>(() => {
    const initial: Record<string, RewardEntry> = {};
    for (let i = 0; i < 7; i++) {
      initial[String(i)] = rewardsByWeekday[String(i)] ?? { label: "", icon: "🎁" };
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);

  function setField(day: string, field: keyof RewardEntry, value: string) {
    setRewards((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateRewards(childId, rewards);
      onSaved("Rewards saved");
    } catch {
      onSaved("Couldn't save rewards — try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {DAY_NAMES.map((day, i) => (
        <div key={day} className="flex items-center gap-2">
          <span className="w-24 text-sm text-zinc-600">{day}</span>
          <input
            value={rewards[String(i)].icon}
            onChange={(e) => setField(String(i), "icon", e.target.value)}
            aria-label={`${day} reward icon`}
            className="w-12 rounded-lg border border-zinc-300 px-2 py-1.5 text-center"
          />
          <input
            value={rewards[String(i)].label}
            onChange={(e) => setField(String(i), "label", e.target.value)}
            aria-label={`${day} reward`}
            placeholder="Reward"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          />
        </div>
      ))}
      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className="mt-2 self-start rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        Save rewards
      </button>
    </div>
  );
}
