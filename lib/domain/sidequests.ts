import type { Sidequest } from "./types";

const STARS_TO_COMPLETE = 3;

/** The lowest-order sidequest not yet completed, or null if the list is empty or all done. */
export function getActiveSidequestId(sidequests: Sidequest[]): string | null {
  const incomplete = sidequests
    .filter((sq) => sq.completedAt === null)
    .sort((a, b) => a.order - b.order);
  return incomplete[0]?.id ?? null;
}

export function applyStarEarned(
  sidequests: Sidequest[],
  sidequestId: string,
  now: string,
): { sidequests: Sidequest[]; completed: boolean } {
  let completed = false;
  const next = sidequests.map((sq) => {
    if (sq.id !== sidequestId) return sq;
    const starsEarned = Math.min(sq.starsEarned + 1, STARS_TO_COMPLETE);
    const justCompleted = starsEarned === STARS_TO_COMPLETE && sq.completedAt === null;
    completed = justCompleted;
    return {
      ...sq,
      starsEarned,
      completedAt: justCompleted ? now : sq.completedAt,
    };
  });
  return { sidequests: next, completed };
}

/** Symmetric rollback for un-marking a practice day that had earned a star. */
export function revertStarEarned(sidequests: Sidequest[], sidequestId: string): Sidequest[] {
  return sidequests.map((sq) => {
    if (sq.id !== sidequestId) return sq;
    const starsEarned = Math.max(sq.starsEarned - 1, 0);
    return {
      ...sq,
      starsEarned,
      completedAt: starsEarned < STARS_TO_COMPLETE ? null : sq.completedAt,
    };
  });
}
