export function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-plum-100 px-4 py-2">
      <span className="text-2xl" role="img" aria-label="streak">
        🔥
      </span>
      <span className="text-xl font-bold text-plum-900">{streak}</span>
      <span className="text-xs text-plum-700">{streak === 1 ? "week" : "weeks"}</span>
    </div>
  );
}
