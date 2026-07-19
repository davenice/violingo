import { doc, getDocFromServer, onSnapshot, type Firestore } from "firebase/firestore";

const CONFIRM_DELAYS_MS = [0, 300, 1000];

function delay(ms: number): Promise<void> {
  return ms === 0 ? Promise.resolve() : new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribes to a document, treating any "document doesn't exist" reading as
 * suspect: presence is reported immediately (cached or live), but absence is
 * only reported after a server read confirms it (or the server is
 * unreachable, when the cached truth is the best available). This shields the
 * app from the Firestore emulator's phantom not-exists snapshots for
 * just-created docs (firebase/firebase-tools#3867) — which occur even with
 * long-polling forced and, if persisted, would poison reloads — at the cost
 * of one extra server read when a doc is genuinely absent.
 */
export function subscribeToDoc<T>(
  db: Firestore,
  path: string,
  onData: (data: T | null) => void,
): () => void {
  let cancelled = false;
  let confirming = false;
  const ref = doc(db, path);

  async function confirmAbsence() {
    if (confirming) return;
    confirming = true;
    try {
      for (const ms of CONFIRM_DELAYS_MS) {
        await delay(ms);
        if (cancelled) return;
        try {
          const snap = await getDocFromServer(ref);
          if (cancelled) return;
          if (snap.exists()) {
            onData(snap.data() as T);
            return;
          }
        } catch {
          // Server unreachable (offline): the cached absence is the best truth.
          break;
        }
      }
      if (!cancelled) onData(null);
    } finally {
      confirming = false;
    }
  }

  const unsubscribe = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      onData(snap.data() as T);
      return;
    }
    void confirmAbsence();
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}
