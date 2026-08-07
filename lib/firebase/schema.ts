import type { StreakConfig, StreakState, WeekOutcome } from "@/lib/domain/types";

export type ChildSettings = StreakConfig;

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

