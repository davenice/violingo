"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useChild } from "@/hooks/useChild";
import { signOut } from "@/lib/firebase/auth";

export default function ParentDashboardPage() {
  const router = useRouter();
  const { child, exitParentMode } = useChild();
  if (!child) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <p className="text-zinc-600">
        Settings for <strong>{child.name}</strong>
      </p>

      <Link
        href="/parent/settings"
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-plum-200"
      >
        <h2 className="font-semibold">Practice & lives</h2>
        <p className="mt-1 text-sm text-zinc-500">
          {child.settings.weeklyTarget}×/week target · 1 life per {child.settings.livesPerSurplus} extra
          practices · max {child.settings.maxLives} lives
        </p>
      </Link>

      <Link
        href="/parent/sidequests"
        className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm hover:border-plum-200"
      >
        <h2 className="font-semibold">Sidequests</h2>
        <p className="mt-1 text-sm text-zinc-500">
          The ordered list of practice targets {child.name} works through.
        </p>
      </Link>

      <button
        type="button"
        onClick={async () => {
          exitParentMode();
          await signOut();
          router.replace("/login");
        }}
        className="mt-4 self-start text-sm text-zinc-500 underline"
      >
        Sign out of this device
      </button>
    </div>
  );
}
