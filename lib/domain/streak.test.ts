import { describe, expect, it } from "vitest";
import { evaluateWeek, finalizeWeek } from "./streak";
import type { StreakConfig, StreakState } from "./types";

const config: StreakConfig = { weeklyTarget: 3, livesPerSurplus: 3, maxLives: 3 };

const zeroState: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  bankedLives: 0,
  surplusCounter: 0,
};

describe("evaluateWeek", () => {
  it("is not met when below target", () => {
    expect(evaluateWeek(2, 3)).toEqual({ met: false, surplus: 0 });
  });

  it("is met with zero surplus exactly at target", () => {
    expect(evaluateWeek(3, 3)).toEqual({ met: true, surplus: 0 });
  });

  it("is met with surplus above target", () => {
    expect(evaluateWeek(5, 3)).toEqual({ met: true, surplus: 2 });
  });
});

describe("finalizeWeek", () => {
  it("exact-target week: streak grows, no surplus, no life banked", () => {
    const { next, outcome } = finalizeWeek(zeroState, 3, config);
    expect(outcome).toBe("met");
    expect(next).toEqual({ currentStreak: 1, longestStreak: 1, bankedLives: 0, surplusCounter: 0 });
  });

  it("surplus crossing exactly N banks one life with zero remainder", () => {
    const { next, outcome } = finalizeWeek(zeroState, 6, config); // target 3, +3 surplus
    expect(outcome).toBe("met");
    expect(next.bankedLives).toBe(1);
    expect(next.surplusCounter).toBe(0);
  });

  it("banks multiple lives in one very productive week", () => {
    const { next } = finalizeWeek(zeroState, 12, config); // target 3, +9 surplus = 3 lives exactly
    expect(next.bankedLives).toBe(3);
    expect(next.surplusCounter).toBe(0);
  });

  it("stops banking lives at maxLives and keeps accruing surplus", () => {
    const atCap: StreakState = { ...zeroState, bankedLives: 3 };
    const { next } = finalizeWeek(atCap, 9, config); // +6 surplus, but no room for lives
    expect(next.bankedLives).toBe(3);
    expect(next.surplusCounter).toBe(6);
  });

  it("broken week resets streak but leaves surplus untouched", () => {
    const withSurplus: StreakState = { ...zeroState, currentStreak: 4, longestStreak: 4, surplusCounter: 2 };
    const { next, outcome } = finalizeWeek(withSurplus, 1, config); // below target, 0 lives
    expect(outcome).toBe("broken");
    expect(next.currentStreak).toBe(0);
    expect(next.longestStreak).toBe(4);
    expect(next.surplusCounter).toBe(2);
  });

  it("saved week consumes a life, continues the streak, and leaves surplus untouched", () => {
    const withLife: StreakState = { ...zeroState, currentStreak: 4, longestStreak: 4, bankedLives: 1, surplusCounter: 2 };
    const { next, outcome } = finalizeWeek(withLife, 1, config); // below target, 1 life
    expect(outcome).toBe("saved");
    expect(next.currentStreak).toBe(5);
    expect(next.longestStreak).toBe(5);
    expect(next.bankedLives).toBe(0);
    expect(next.surplusCounter).toBe(2);
  });

  it("a life spent one week can be immediately re-banked once next week's surplus crosses N", () => {
    const afterSave: StreakState = { ...zeroState, currentStreak: 5, longestStreak: 5, bankedLives: 0, surplusCounter: 2 };
    const { next } = finalizeWeek(afterSave, 4, config); // target 3, +1 surplus -> total surplus 3 -> banks 1 life
    expect(next.bankedLives).toBe(1);
    expect(next.surplusCounter).toBe(0);
  });

  it("longestStreak tracks the historical max even after a break", () => {
    const long: StreakState = { ...zeroState, currentStreak: 7, longestStreak: 7 };
    const { next } = finalizeWeek(long, 0, config);
    expect(next.currentStreak).toBe(0);
    expect(next.longestStreak).toBe(7);
  });

  it("multi-week catch-up: sequential weeks with mixed met/saved/broken outcomes", () => {
    // Simulates a scheduled rollover function processing several unfinalized weeks in order.
    // week1: 6 practices -> met, +3 surplus banks 1 life -> streak1, lives1, surplus0
    // week2: 1 practice  -> not met, 1 life spent to save -> streak2, lives0, surplus0
    // week3: 1 practice  -> not met, 0 lives -> broken -> streak0
    // week4: 1 practice  -> not met, 0 lives -> broken -> streak0
    // week5: 6 practices -> met, +3 surplus banks 1 life -> streak1, lives1, surplus0
    const weeks = [6, 1, 1, 1, 6];
    let state = zeroState;
    const outcomes: string[] = [];
    for (const practiceCount of weeks) {
      const result = finalizeWeek(state, practiceCount, config);
      state = result.next;
      outcomes.push(result.outcome);
    }
    expect(outcomes).toEqual(["met", "saved", "broken", "broken", "met"]);
    expect(state).toEqual({ currentStreak: 1, longestStreak: 2, bankedLives: 1, surplusCounter: 0 });
  });
});
