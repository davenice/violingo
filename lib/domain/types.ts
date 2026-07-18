export interface StreakConfig {
  weeklyTarget: number;
  livesPerSurplus: number;
  maxLives: number;
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  bankedLives: number;
  surplusCounter: number;
}

export type WeekOutcome = "met" | "saved" | "broken";

export interface FinalizeWeekResult {
  next: StreakState;
  outcome: WeekOutcome;
}

export interface Sidequest {
  id: string;
  order: number;
  starsEarned: number;
  completedAt: string | null;
}
