import type { StreakConfig, StreakState, WeekOutcome } from "@/lib/domain/types";

export interface RewardEntry {
  label: string;
  icon: string;
}

export interface ChildSettings extends StreakConfig {
  rewardsByWeekday: Record<string, RewardEntry>;
}

export interface ChildStreakState extends StreakState {
  lastEvaluatedWeekStart: string;
  currentWeekPracticeCount: number;
  lastWeekOutcome: WeekOutcome | null;
}

export interface ChildDoc {
  parentId: string;
  name: string;
  pinHash: string | null;
  timezone: string;
  settings: ChildSettings;
  streakState: ChildStreakState;
  activeSidequestId: string | null;
}

export interface ParentDoc {
  displayName: string;
  email: string;
  childId: string | null;
  timezone: string;
}

export interface PracticeLogEntry {
  date: string;
  weekStart: string;
  practiced: boolean;
  sidequestId: string | null;
  sidequestStarEarned: boolean;
}

export interface SidequestDoc {
  order: number;
  name: string;
  description: string | null;
  starsEarned: number;
  completedAt: string | null;
}

export const DEFAULT_REWARDS_BY_WEEKDAY: Record<string, RewardEntry> = {
  "0": { label: "2 surprise bags", icon: "🎁" },
  "1": { label: "3 surprise bags", icon: "🎁" },
  "2": { label: "A toy", icon: "🧸" },
  "3": { label: "4 surprise bags", icon: "🎁" },
  "4": { label: "A toy", icon: "🧸" },
  "5": { label: "Filament", icon: "🧵" },
  "6": { label: "5 surprise bags", icon: "🎁" },
};
