import { weekdayIndexOfKey } from "@/lib/domain/dates";

interface WeekPathProps {
  weekDates: string[];
  practicedDates: Set<string>;
  todayKey: string;
  target: number;
  onToggle: (date: string) => void;
  busy: boolean;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function WeekPath({
  weekDates,
  practicedDates,
  todayKey,
  target,
  onToggle,
  busy,
}: WeekPathProps) {
  const practicedInOrder = weekDates.filter((d) => practicedDates.has(d));
  const count = practicedInOrder.length;

  return (
    <section className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">This week</h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            count >= target ? "bg-emerald-100 text-emerald-800" : "bg-plum-100 text-plum-800"
          }`}
        >
          {count >= target ? "🚩 Target hit!" : `${count} of ${target} 🚩`}
        </span>
      </header>
      <div className="grid grid-cols-7 gap-1">
        {weekDates.map((date) => {
          const practiced = practicedDates.has(date);
          const isToday = date === todayKey;
          const isFuture = date > todayKey;
          // Practices beyond the weekly target are "bonus" (they feed the
          // surplus counter); badge them so that progress is visible in place.
          const practicedIndex = practicedInOrder.indexOf(date);
          const isBonus = practiced && practicedIndex >= target;

          return (
            <button
              key={date}
              disabled={busy || isFuture}
              onClick={() => onToggle(date)}
              aria-label={`${DAY_LABELS[weekdayIndexOfKey(date)]} ${date}${practiced ? ", practiced" : ""}`}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 transition-colors disabled:opacity-40 ${
                practiced
                  ? "border-emerald-400 bg-emerald-50"
                  : isToday
                    ? "border-plum-400 bg-plum-50"
                    : "border-zinc-200 bg-white"
              }`}
            >
              <span className="text-[10px] font-medium text-zinc-500">
                {DAY_LABELS[weekdayIndexOfKey(date)]}
              </span>
              <span className="text-lg" role="img" aria-hidden>
                {practiced ? (isBonus ? "⭐" : "✅") : "🎻"}
              </span>
              <span className={`text-[10px] ${isToday ? "font-bold text-plum-700" : "text-zinc-400"}`}>
                {Number(date.slice(-2))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
