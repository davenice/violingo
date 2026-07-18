import { doc, getDocFromServer, onSnapshot, type Firestore } from "firebase/firestore";

const RECHECK_DELAYS_MS = [150, 400, 800];

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Subscribes to a document, treating a "document disappeared" reading with
 * suspicion: it is re-verified with a few short, growing-delay retries
 * against the server before being trusted. A genuine deletion is still
 * reflected (after ~1s worst case), but a transient false negative — as the
 * Firestore emulator's streaming transport produces for just-created docs
 * (firebase/firebase-tools#3867; primary mitigation is forcing long-polling
 * in client.ts) — never bounces the UI back to a logged-out/onboarding state.
 */
export function subscribeToDoc<T>(
  db: Firestore,
  path: string,
  onData: (data: T | null) => void,
): () => void {
  let sawDoc = false;
  let cancelled = false;
  const ref = doc(db, path);

  async function reverify() {
    for (const ms of RECHECK_DELAYS_MS) {
      await delay(ms);
      if (cancelled) return;
      const recheck = await getDocFromServer(ref);
      if (recheck.exists()) {
        onData(recheck.data() as T);
        return;
      }
    }
    if (!cancelled) onData(null);
  }

  const unsubscribe = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      sawDoc = true;
      onData(snap.data() as T);
      return;
    }
    if (!sawDoc) {
      onData(null);
      return;
    }
    void reverify();
  });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}
