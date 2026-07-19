"use client";

import Link from "next/link";
import { useChild } from "@/hooks/useChild";
import { useSidequests } from "@/hooks/useSidequests";
import { SidequestListEditor } from "@/components/parent/SidequestListEditor";
import { Toast, useToast } from "@/components/child/Toast";

export default function ParentSidequestsPage() {
  const { child, childId } = useChild();
  const sidequests = useSidequests(childId);
  const { toast, showToast } = useToast();
  if (!child || !childId) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <Link href="/parent" className="text-sm text-plum-600 underline">
        ← Back
      </Link>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Sidequests</h2>
        <SidequestListEditor
          childId={childId}
          sidequests={sidequests}
          activeSidequestId={child.activeSidequestId}
          onSaved={showToast}
        />
      </section>

      <Toast message={toast} />
    </div>
  );
}
