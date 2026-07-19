interface LivesTrackerProps {
  bankedLives: number;
  maxLives: number;
  surplus: number;
  surplusPerLife: number;
}

export function LivesTracker({ bankedLives, maxLives, surplus, surplusPerLife }: LivesTrackerProps) {
  const atCap = bankedLives >= maxLives;
  return (
    <div className="flex flex-col items-center rounded-2xl bg-coral-50 px-4 py-2">
      <div className="flex gap-1 text-2xl" aria-label={`${bankedLives} of ${maxLives} lives`}>
        {Array.from({ length: maxLives }, (_, i) => (
          <span key={i} role="img" aria-hidden className={i < bankedLives ? "" : "opacity-25 grayscale"}>
            ❤️
          </span>
        ))}
      </div>
      {atCap ? (
        <span className="text-xs text-coral-700">Lives full!</span>
      ) : (
        <>
          <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-coral-100">
            <div
              className="h-full rounded-full bg-coral-500 transition-all"
              style={{ width: `${Math.min((surplus / surplusPerLife) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-coral-700">
            {surplus}/{surplusPerLife} to next life
          </span>
        </>
      )}
    </div>
  );
}
