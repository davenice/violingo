import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

const USE_EMULATOR = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";

const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(app);
// The emulator's WebChannel streaming transport drops/reorders snapshot events
// for just-created docs in browsers (firebase/firebase-tools#3867); forcing
// long-polling avoids it. Production keeps the default transport.
export const db = initializeFirestore(app, {
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
  globalThis.__violingoEmulatorsConnected = true;
}
