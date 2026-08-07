import { collection, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "./client";
import { getActiveSidequestId } from "@/lib/domain/sidequests";
import type { SidequestWithId } from "@/hooks/useSidequests";

export async function updateWeeklyTarget(childId: string, weeklyTarget: number): Promise<void> {
  await updateDoc(doc(db, `children/${childId}`), { "settings.weeklyTarget": weeklyTarget });
}

export async function updateLivesConfig(
  childId: string,
  livesPerSurplus: number,
  maxLives: number,
): Promise<void> {
  await updateDoc(doc(db, `children/${childId}`), {
    "settings.livesPerSurplus": livesPerSurplus,
    "settings.maxLives": maxLives,
  });
}

function activeIdOf(sidequests: { id: string; order: number; completedAt: string | null }[]) {
  return getActiveSidequestId(
    sidequests.map((sq) => ({ ...sq, starsEarned: 0 })), // starsEarned unused by the calc
  );
}

/** Adds a quest at the end of the list, updating the active pointer if it's the first incomplete one. */
export async function addSidequest(
  childId: string,
  current: SidequestWithId[],
  name: string,
): Promise<void> {
  const batch = writeBatch(db);
  const ref = doc(collection(db, `children/${childId}/sidequests`));
  const order = current.length ? Math.max(...current.map((sq) => sq.order)) + 1 : 0;
  batch.set(ref, { order, name, description: null, starsEarned: 0, completedAt: null, createdAt: new Date() });
  const next = [...current, { id: ref.id, order, name, description: null, starsEarned: 0, completedAt: null }];
  batch.update(doc(db, `children/${childId}`), { activeSidequestId: activeIdOf(next) });
  await batch.commit();
}

export async function renameSidequest(childId: string, id: string, name: string): Promise<void> {
  await updateDoc(doc(db, `children/${childId}/sidequests/${id}`), { name });
}

export async function deleteSidequest(
  childId: string,
  current: SidequestWithId[],
  id: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, `children/${childId}/sidequests/${id}`));
  const next = current.filter((sq) => sq.id !== id);
  batch.update(doc(db, `children/${childId}`), { activeSidequestId: activeIdOf(next) });
  await batch.commit();
}

/** Swaps a quest with its neighbour above (-1) or below (+1) in order. */
export async function moveSidequest(
  childId: string,
  current: SidequestWithId[],
  id: string,
  direction: -1 | 1,
): Promise<void> {
  const sorted = [...current].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((sq) => sq.id === id);
  const neighbour = sorted[index + direction];
  if (index === -1 || !neighbour) return;
  const quest = sorted[index];

  const batch = writeBatch(db);
  batch.update(doc(db, `children/${childId}/sidequests/${quest.id}`), { order: neighbour.order });
  batch.update(doc(db, `children/${childId}/sidequests/${neighbour.id}`), { order: quest.order });
  const next = current.map((sq) =>
    sq.id === quest.id
      ? { ...sq, order: neighbour.order }
      : sq.id === neighbour.id
        ? { ...sq, order: quest.order }
        : sq,
  );
  batch.update(doc(db, `children/${childId}`), { activeSidequestId: activeIdOf(next) });
  await batch.commit();
}
