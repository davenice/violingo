import { weekdayIndexOfKey } from "@/lib/domain/dates";
import type { RewardEntry } from "@/lib/firebase/schema";

interface LastPrizeProps {
  practicedDates: string[];
  rewardsByWeekday: Record<string, RewardEntry>;
}

export function LastPrize({ practicedDates, rewardsByWeekday }: LastPrizeProps) {
  const latest = practicedDates.length ? practicedDates[practicedDates.length - 1] : null;
  const prize = latest ? rewardsByWeekday[String(weekdayIndexOfKey(latest))] : null;

  return (
    <section className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
      <span className="text-3xl" role="img" aria-hidden>
        {prize?.icon ?? "🎁"}
      </span>
      <div>
        <p className="text-xs font-medium text-zinc-400">Your last prize</p>
        <p className="text-sm font-medium">
          {prize ? prize.label : "Practice to win your first prize!"}
        </p>
      </div>
    </section>
  );
}
