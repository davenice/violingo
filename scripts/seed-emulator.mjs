// Seeds the local Firestore emulator with one sample family for UI development.
// Usage: run `npm run emulators` in one terminal, then `npm run seed:emulator` in another.
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

const PROJECT_ID = "violingo-rules-test";
const PARENT_UID = "seed-parent";
const CHILD_ID = "seed-child";

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

async function seed() {
  await db.doc(`parents/${PARENT_UID}`).set({
    displayName: "Sample Parent",
    email: "parent@example.com",
    childId: CHILD_ID,
    timezone: "Europe/London",
    createdAt: new Date(),
  });

  await db.doc(`children/${CHILD_ID}`).set({
    parentId: PARENT_UID,
    name: "Sample Child",
    pinHash: null,
    timezone: "Europe/London",
    createdAt: new Date(),
    settings: {
      weeklyTarget: 3,
      livesPerSurplus: 3,
      maxLives: 3,
    },
    streakState: {
      currentStreak: 2,
      longestStreak: 4,
      bankedLives: 1,
      surplusCounter: 1,
      lastEvaluatedWeekStart: "2026-06-29",
      currentWeekPracticeCount: 1,
      lastWeekOutcome: "met",
      updatedAt: new Date(),
    },
    activeSidequestId: "sq-scales",
  });

  const sidequests = [
    { id: "sq-scales", order: 0, name: "G major scale", starsEarned: 1, completedAt: null },
    { id: "sq-sight-reading", order: 1, name: "Sight reading", starsEarned: 0, completedAt: null },
    { id: "sq-vibrato", order: 2, name: "Vibrato basics", starsEarned: 0, completedAt: null },
  ];
  for (const sq of sidequests) {
    await db.doc(`children/${CHILD_ID}/sidequests/${sq.id}`).set({
      ...sq,
      description: null,
      createdAt: new Date(),
    });
  }

  await db.doc(`children/${CHILD_ID}/practiceLog/2026-07-06`).set({
    date: "2026-07-06",
    weekStart: "2026-07-06",
    practiced: true,
    loggedAt: new Date(),
    updatedAt: new Date(),
    sidequestId: "sq-scales",
    sidequestStarEarned: true,
  });

  console.log(`Seeded parent ${PARENT_UID} and child ${CHILD_ID} into the Firestore emulator.`);
}

seed().then(() => process.exit(0));
