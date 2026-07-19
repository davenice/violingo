import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { addWeeks, getWeekStart } from "../../lib/domain/dates";
import { finalizeWeek } from "../../lib/domain/streak";
import type { StreakConfig, StreakState, WeekOutcome } from "../../lib/domain/types";

// Safety valve for pathological lastEvaluatedWeekStart values (10 years).
const MAX_CATCHUP_WEEKS = 520;

export interface RolloverResult {
  childId: string;
  weeksFinalized: number;
  outcomes: WeekOutcome[];
}

/**
 * Finalizes every fully-elapsed week for one child, in order, inside a
 * transaction. Idempotent: once lastEvaluatedWeekStart has caught up to the
 * current week (in the child's own timezone), reruns are no-ops — so an hourly
 * schedule is safe, and multiple missed runs catch up in one pass.
 */
export async function rolloverChild(
  db: Firestore,
  childId: string,
  now: Date,
): Promise<RolloverResult> {
  const childRef = db.doc(`children/${childId}`);

  return db.runTransaction(async (txn) => {
    const snap = await txn.get(childRef);
    if (!snap.exists) return { childId, weeksFinalized: 0, outcomes: [] };
    const child = snap.data()!;

    const timezone: string = child.timezone ?? "UTC";
    const currentWeekStart = getWeekStart(now, timezone);
    let weekStart: string = child.streakState.lastEvaluatedWeekStart;
    if (weekStart >= currentWeekStart) return { childId, weeksFinalized: 0, outcomes: [] };

    const config: StreakConfig = {
      weeklyTarget: child.settings.weeklyTarget,
      livesPerSurplus: child.settings.livesPerSurplus,
      maxLives: child.settings.maxLives,
    };
    let state: StreakState = {
      currentStreak: child.streakState.currentStreak,
      longestStreak: child.streakState.longestStreak,
      bankedLives: child.streakState.bankedLives,
      surplusCounter: child.streakState.surplusCounter,
    };
    let lastWeekOutcome: WeekOutcome | null = child.streakState.lastWeekOutcome ?? null;

    const logCollection = db.collection(`children/${childId}/practiceLog`);
    const countPracticed = async (week: string) => {
      const result = await txn.get(
        logCollection.where("weekStart", "==", week).where("practiced", "==", true).count(),
      );
      return result.data().count;
    };

    const outcomes: WeekOutcome[] = [];
    while (weekStart < currentWeekStart && outcomes.length < MAX_CATCHUP_WEEKS) {
      const practiceCount = await countPracticed(weekStart);
      const result = finalizeWeek(state, practiceCount, config);
      state = result.next;
      lastWeekOutcome = result.outcome;
      outcomes.push(result.outcome);
      weekStart = addWeeks(weekStart, 1);
    }

    const currentWeekPracticeCount = await countPracticed(currentWeekStart);

    txn.update(childRef, {
      streakState: {
        ...state,
        lastEvaluatedWeekStart: weekStart,
        currentWeekPracticeCount,
        lastWeekOutcome,
        updatedAt: FieldValue.serverTimestamp(),
      },
    });

    return { childId, weeksFinalized: outcomes.length, outcomes };
  });
}

export async function rolloverAllChildren(db: Firestore, now: Date): Promise<RolloverResult[]> {
  const children = await db.collection("children").select().get();
  const results: RolloverResult[] = [];
  for (const doc of children.docs) {
    try {
      results.push(await rolloverChild(db, doc.id, now));
    } catch (err) {
      // One broken child document must not block the rest of the fleet.
      console.error(`rollover failed for child ${doc.id}`, err);
    }
  }
  return results;
}
