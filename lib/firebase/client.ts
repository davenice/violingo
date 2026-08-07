import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { firebaseConfig } from "./config";

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const functions = getFunctions(app);
// - persistentLocalCache: IndexedDB-backed offline cache, so practice data
//   renders (and taps queue) without a connection; multi-tab safe. Disabled
//   in emulator mode: the emulator emits phantom not-exists snapshots for
//   just-created docs (firebase/firebase-tools#3867), and persisting those
//   would poison every subsequent reload of a throwaway emulator session.
// - experimentalForceLongPolling: the same emulator transport bug is worst on
//   the default WebChannel streaming transport; long-polling reduces it.
//   Production keeps the default transport.
export const db = initializeFirestore(app, {
  localCache:
    typeof window !== "undefined" && !USE_EMULATOR
      ? persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      : undefined,
  experimentalForceLongPolling: USE_EMULATOR,
});

// Point at the local emulators instead of production when explicitly opted in
// (see npm run dev:emulator) — never connects unless the env var is set.
declare global {
   
  var __violingoEmulatorsConnected: boolean | undefined;
}

if (typeof window !== "undefined" && USE_EMULATOR && !globalThis.__violingoEmulatorsConnected) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  globalThis.__violingoEmulatorsConnected = true;
}
