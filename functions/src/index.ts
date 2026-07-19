import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { rolloverAllChildren } from "./rollover";

initializeApp();

// Hourly is cheap and catches each family's local Monday-midnight promptly
// regardless of timezone; rolloverChild is idempotent so extra runs are no-ops.
export const weeklyRollover = onSchedule("every 1 hours", async () => {
  const results = await rolloverAllChildren(getFirestore(), new Date());
  const finalized = results.filter((r) => r.weeksFinalized > 0);
  logger.info("weeklyRollover complete", {
    children: results.length,
    childrenFinalized: finalized.length,
    details: finalized,
  });
});
