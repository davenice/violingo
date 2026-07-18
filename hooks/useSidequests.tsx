"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { SidequestDoc } from "@/lib/firebase/schema";

export interface SidequestWithId extends SidequestDoc {
  id: string;
}

/** Live ordered list of a child's sidequests. */
export function useSidequests(childId: string | null): SidequestWithId[] {
  const [sidequests, setSidequests] = useState<SidequestWithId[]>([]);

  useEffect(() => {
    if (!childId) return;
    const q = query(collection(db, `children/${childId}/sidequests`), orderBy("order"));
    return onSnapshot(q, (snap) => {
      setSidequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as SidequestDoc) })));
    });
  }, [childId]);

  return childId ? sidequests : [];
}
