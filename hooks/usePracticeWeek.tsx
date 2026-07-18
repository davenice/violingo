"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { PracticeLogEntry } from "@/lib/firebase/schema";

/** Live map of date key -> log entry for one week of a child's practice log. */
export function usePracticeWeek(
  childId: string | null,
  weekStart: string,
): Map<string, PracticeLogEntry> {
  const [entries, setEntries] = useState<Map<string, PracticeLogEntry>>(new Map());

  useEffect(() => {
    if (!childId) return;
    const q = query(
      collection(db, `children/${childId}/practiceLog`),
      where("weekStart", "==", weekStart),
    );
    return onSnapshot(q, (snap) => {
      const next = new Map<string, PracticeLogEntry>();
      for (const docSnap of snap.docs) {
        next.set(docSnap.id, docSnap.data() as PracticeLogEntry);
      }
      setEntries(next);
    });
  }, [childId, weekStart]);

  return childId ? entries : new Map();
}
