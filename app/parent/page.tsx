"use client";

import { useChild } from "@/hooks/useChild";

export default function ParentDashboardPage() {
  const { child } = useChild();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-zinc-600">
        Signed in as parent of <strong>{child?.name}</strong>.
      </p>
      <p className="text-sm text-zinc-500">
        Weekly target, lives, and sidequest settings are coming in a later build phase.
      </p>
    </div>
  );
}
