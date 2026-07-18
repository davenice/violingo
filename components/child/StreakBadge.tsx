export function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-violet-100 px-4 py-2">
      <span className="text-2xl" role="img" aria-label="streak">
        🔥
      </span>
      <span className="text-xl font-bold text-violet-900">{streak}</span>
      <span className="text-xs text-violet-700">{streak === 1 ? "week" : "weeks"}</span>
    </div>
  );
}
