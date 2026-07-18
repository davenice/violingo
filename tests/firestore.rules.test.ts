import { readFileSync } from "fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

const ALICE = "alice-uid";
const BOB = "bob-uid";
const ALICES_CHILD = "child-of-alice";

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "violingo-rules-test",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

async function seedAlicesChild() {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `children/${ALICES_CHILD}`), {
      parentId: ALICE,
      name: "Junior",
    });
    await setDoc(doc(db, `children/${ALICES_CHILD}/practiceLog/2026-07-06`), {
      practiced: true,
    });
  });
}

describe("parents/{uid}", () => {
  it("lets a parent read and write their own doc", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(setDoc(doc(db, `parents/${ALICE}`), { displayName: "Alice" }));
    await assertSucceeds(getDoc(doc(db, `parents/${ALICE}`)));
  });

  it("blocks writing to another parent's doc", async () => {
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(setDoc(doc(db, `parents/${ALICE}`), { displayName: "Hijacked" }));
  });

  it("blocks unauthenticated access entirely", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `parents/${ALICE}`)));
  });
});

describe("children/{childId}", () => {
  it("lets a parent create a child doc with their own parentId", async () => {
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(db, `children/${ALICES_CHILD}`), { parentId: ALICE, name: "Junior" }),
    );
  });

  it("blocks creating a child doc claiming someone else's parentId", async () => {
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(
      setDoc(doc(db, `children/${ALICES_CHILD}`), { parentId: ALICE, name: "Hijacked" }),
    );
  });

  it("lets the owning parent read their child doc", async () => {
    await seedAlicesChild();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(getDoc(doc(db, `children/${ALICES_CHILD}`)));
  });

  it("blocks a different parent from reading someone else's child doc", async () => {
    await seedAlicesChild();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, `children/${ALICES_CHILD}`)));
  });
});

describe("children/{childId}/practiceLog/{date}", () => {
  it("lets the owning parent read and write practice log entries", async () => {
    await seedAlicesChild();
    const db = testEnv.authenticatedContext(ALICE).firestore();
    await assertSucceeds(
      setDoc(doc(db, `children/${ALICES_CHILD}/practiceLog/2026-07-07`), { practiced: true }),
    );
    await assertSucceeds(getDoc(doc(db, `children/${ALICES_CHILD}/practiceLog/2026-07-06`)));
  });

  it("blocks a different parent from reading or writing practice log entries", async () => {
    await seedAlicesChild();
    const db = testEnv.authenticatedContext(BOB).firestore();
    await assertFails(getDoc(doc(db, `children/${ALICES_CHILD}/practiceLog/2026-07-06`)));
    await assertFails(
      setDoc(doc(db, `children/${ALICES_CHILD}/practiceLog/2026-07-07`), { practiced: true }),
    );
  });

  it("blocks unauthenticated access to practice log entries", async () => {
    await seedAlicesChild();
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, `children/${ALICES_CHILD}/practiceLog/2026-07-06`)));
  });
});
