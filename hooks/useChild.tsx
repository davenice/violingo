"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { db } from "@/lib/firebase/client";
import { subscribeToDoc } from "@/lib/firebase/subscribeDoc";
import { verifyPin } from "@/lib/domain/pin";
import type { ChildDoc, ParentDoc } from "@/lib/firebase/schema";
import { useAuth } from "./useAuth";

type Mode = "child" | "parent";
const MODE_STORAGE_KEY = "violingo-mode";

function readStoredMode(): Mode {
  if (typeof window === "undefined") return "child";
  return window.localStorage.getItem(MODE_STORAGE_KEY) === "parent" ? "parent" : "child";
}

interface ChildContextValue {
  parent: ParentDoc | null;
  childId: string | null;
  child: ChildDoc | null;
  loading: boolean;
  mode: Mode;
  enterParentMode: (pin: string) => Promise<boolean>;
  exitParentMode: () => void;
}

const ChildContext = createContext<ChildContextValue>({
  parent: null,
  childId: null,
  child: null,
  loading: true,
  mode: "child",
  enterParentMode: async () => false,
  exitParentMode: () => {},
});

export function ChildProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [parentDoc, setParentDoc] = useState<ParentDoc | null>(null);
  const [parentDocLoading, setParentDocLoading] = useState(true);
  const [childDoc, setChildDoc] = useState<ChildDoc | null>(null);
  const [childDocLoading, setChildDocLoading] = useState(true);
  const [mode, setModeState] = useState<Mode>(readStoredMode);

  // Subscriptions only ever setState from within the onSnapshot callback; the
  // "no user" / "no child" cases are handled by deriving `parent`/`child`
  // below rather than resetting state synchronously in the effect body.
  useEffect(() => {
    if (!user) return;
    return subscribeToDoc<ParentDoc>(db, `parents/${user.uid}`, (data) => {
      setParentDoc(data);
      setParentDocLoading(false);
    });
  }, [user]);

  const parent = user ? parentDoc : null;
  const parentLoading = authLoading || (!!user && parentDocLoading);
  const childId = parent?.childId ?? null;

  useEffect(() => {
    if (!childId) return;
    return subscribeToDoc<ChildDoc>(db, `children/${childId}`, (data) => {
      setChildDoc(data);
      setChildDocLoading(false);
    });
  }, [childId]);

  const child = childId ? childDoc : null;
  const loading = parentLoading || (!!childId && childDocLoading);

  function setMode(next: Mode) {
    setModeState(next);
    window.localStorage.setItem(MODE_STORAGE_KEY, next);
  }

  async function enterParentMode(pin: string): Promise<boolean> {
    if (!child?.pinHash || !childId) return false;
    const ok = await verifyPin(pin, childId, child.pinHash);
    if (ok) setMode("parent");
    return ok;
  }

  function exitParentMode() {
    setMode("child");
  }

  return (
    <ChildContext.Provider
      value={{ parent, childId, child, loading, mode, enterParentMode, exitParentMode }}
    >
      {children}
    </ChildContext.Provider>
  );
}

export function useChild() {
  return useContext(ChildContext);
}
