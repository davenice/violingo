import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./client";
import { weekStartOfKey } from "@/lib/domain/dates";
import type { ChildDoc, PracticeLogEntry } from "./schema";

export interface ToggleResult {
  practiced: boolean;
  targetJustHit: boolean;
  sidequestStarReverted: boolean;
}

/**
 * Marks or unmarks a day as practiced. Keeps streakState.currentWeekPracticeCount
 * in step for days in the child's current (unfinalized) week, and if the day
 * being unmarked had earned a sidequest star, rolls that star back — including
 * un-completing the sidequest and restoring it as active.
 */
export async function togglePracticeDay(childId: string, date: string): Promise<ToggleResult> {
  const childRef = doc(db, `children/${childId}`);
  const logRef = doc(db, `children/${childId}/practiceLog/${date}`);
  const weekStart = weekStartOfKey(date);

  return runTransaction(db, async (txn) => {
    const childSnap = await txn.get(childRef);
    if (!childSnap.exists()) throw new Error("Child profile not found");
    const child = childSnap.data() as ChildDoc;

    const logSnap = await txn.get(logRef);
    const log = logSnap.exists() ? (logSnap.data() as PracticeLogEntry) : null;
    const wasPracticed = log?.practiced ?? false;
    const practiced = !wasPracticed;

    let sidequestStarReverted = false;
    if (!practiced && log?.sidequestStarEarned && log.sidequestId) {
      const questRef = doc(db, `children/${childId}/sidequests/${log.sidequestId}`);
      const questSnap = await txn.get(questRef);
      if (questSnap.exists()) {
        const stars = Math.max((questSnap.data().starsEarned ?? 0) - 1, 0);
        txn.update(questRef, { starsEarned: stars, completedAt: null });
        // It was the lowest-order incomplete quest when its last star was
        // earned, so on rollback it is again — safe to restore directly.
        txn.update(childRef, { activeSidequestId: log.sidequestId });
        sidequestStarReverted = true;
      }
    }

    if (logSnap.exists()) {
      txn.update(logRef, {
        practiced,
        updatedAt: serverTimestamp(),
        ...(practiced ? {} : { sidequestId: null, sidequestStarEarned: false }),
      });
    } else {
      txn.set(logRef, {
        date,
        weekStart,
        practiced,
        loggedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sidequestId: null,
        sidequestStarEarned: false,
      });
    }

    // The UI only offers current-week days, so the denormalized count can be
    // adjusted unconditionally; past weeks are finalized by the rollover
    // function from the log itself.
    const target = child.settings.weeklyTarget;
    const prevCount = child.streakState.currentWeekPracticeCount;
    const nextCount = Math.max(prevCount + (practiced ? 1 : -1), 0);
    txn.update(childRef, {
      "streakState.currentWeekPracticeCount": nextCount,
      "streakState.updatedAt": serverTimestamp(),
    });
    const targetJustHit = practiced && prevCount < target && nextCount >= target;

    return { practiced, targetJustHit, sidequestStarReverted };
  });
}

export type TagResult =
  | { action: "star"; completed: boolean }
  | { action: "untagged" }
  | { action: "rejected"; reason: string };

/**
 * Tags (or untags) a practiced day as having worked on the given sidequest,
 * earning/reverting one star. `nextActiveSidequestId` is the caller's view of
 * which quest becomes active if this star completes the quest (computed from
 * the subscribed, ordered quest list).
 */
export async function tagSidequestForDay(
  childId: string,
  date: string,
  sidequestId: string,
  nextActiveSidequestId: string | null,
): Promise<TagResult> {
  const childRef = doc(db, `children/${childId}`);
  const logRef = doc(db, `children/${childId}/practiceLog/${date}`);
  const questRef = doc(db, `children/${childId}/sidequests/${sidequestId}`);

  return runTransaction(db, async (txn) => {
    const logSnap = await txn.get(logRef);
    const log = logSnap.exists() ? (logSnap.data() as PracticeLogEntry) : null;
    if (!log?.practiced) return { action: "rejected", reason: "Practice today first!" } as const;

    const questSnap = await txn.get(questRef);
    if (!questSnap.exists()) return { action: "rejected", reason: "Sidequest not found" } as const;
    const stars = questSnap.data().starsEarned ?? 0;

    if (log.sidequestStarEarned && log.sidequestId === sidequestId) {
      txn.update(questRef, { starsEarned: Math.max(stars - 1, 0), completedAt: null });
      txn.update(logRef, { sidequestId: null, sidequestStarEarned: false, updatedAt: serverTimestamp() });
      txn.update(childRef, { activeSidequestId: sidequestId });
      return { action: "untagged" } as const;
    }

    if (log.sidequestStarEarned) {
      return { action: "rejected", reason: "This day already has a sidequest star" } as const;
    }

    const nextStars = Math.min(stars + 1, 3);
    const completed = nextStars === 3;
    txn.update(questRef, { starsEarned: nextStars, ...(completed ? { completedAt: date } : {}) });
    txn.update(logRef, { sidequestId, sidequestStarEarned: true, updatedAt: serverTimestamp() });
    if (completed) txn.update(childRef, { activeSidequestId: nextActiveSidequestId });
    return { action: "star", completed } as const;
  });
}
