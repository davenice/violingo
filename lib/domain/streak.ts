import type { FinalizeWeekResult, StreakConfig, StreakState, WeekOutcome } from "./types";

export function evaluateWeek(
  practiceCount: number,
  target: number,
): { met: boolean; surplus: number } {
  const met = practiceCount >= target;
  return { met, surplus: met ? practiceCount - target : 0 };
}

/**
 * Applies one calendar week's outcome to streak state. Surplus and lives are
 * independent counters: spending a life to save a streak never touches
 * surplus, and a broken streak never resets surplus (it's lifetime credit,
 * not tied to streak continuity).
 */
export function finalizeWeek(
  prev: StreakState,
  practiceCount: number,
  config: StreakConfig,
): FinalizeWeekResult {
  let { currentStreak, bankedLives, surplusCounter } = prev;
  let outcome: WeekOutcome;

  const { met, surplus } = evaluateWeek(practiceCount, config.weeklyTarget);

  if (met) {
    outcome = "met";
    currentStreak += 1;
    surplusCounter += surplus;
  } else if (bankedLives > 0) {
    outcome = "saved";
    bankedLives -= 1;
    currentStreak += 1;
  } else {
    outcome = "broken";
    currentStreak = 0;
  }

  while (surplusCounter >= config.livesPerSurplus && bankedLives < config.maxLives) {
    surplusCounter -= config.livesPerSurplus;
    bankedLives += 1;
  }

  const longestStreak = Math.max(prev.longestStreak, currentStreak);

  return {
    next: { currentStreak, longestStreak, bankedLives, surplusCounter },
    outcome,
  };
}
