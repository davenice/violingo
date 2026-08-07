"use client";

import { useState } from "react";
import Link from "next/link";
import { useChild } from "@/hooks/useChild";
import { Stepper } from "@/components/parent/Stepper";
import { Toast, useToast } from "@/components/child/Toast";
import { updateLivesConfig, updateWeeklyTarget } from "@/lib/firebase/parentActions";
import { createSignInCode } from "@/lib/firebase/auth";

type CodeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; code: string }
  | { status: "error" };

function SignInCodeSection() {
  const [state, setState] = useState<CodeState>({ status: "idle" });

  async function generate() {
    setState({ status: "loading" });
    try {
      const { code } = await createSignInCode();
      setState({ status: "ready", code });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Sign in on another device</h2>
      <p className="mt-1 text-sm text-zinc-600">
        For the installed app (e.g. on an iPad home screen), which can&apos;t follow the email
        sign-in link. Generate a code here, then enter it on that device&apos;s sign-in screen
        within 5 minutes.
      </p>
      {state.status === "ready" ? (
        <div className="mt-3 flex flex-col items-center gap-1">
          <p className="font-mono text-3xl font-semibold tracking-widest">{state.code}</p>
          <button type="button" onClick={generate} className="text-sm text-plum-600 underline">
            Generate a new code
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={generate}
          disabled={state.status === "loading"}
          className="mt-3 rounded-lg bg-plum-600 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {state.status === "loading" ? "Generating…" : "Generate code"}
        </button>
      )}
      {state.status === "error" && (
        <p className="mt-2 text-sm text-red-600">Couldn&apos;t generate a code — try again.</p>
      )}
    </section>
  );
}

export default function ParentSettingsPage() {
  const { child, childId } = useChild();
  const { toast, showToast } = useToast();
  if (!child || !childId) return null;

  async function save(action: () => Promise<void>) {
    try {
      await action();
      showToast("Saved");
    } catch {
      showToast("Couldn't save — try again");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <Link href="/parent" className="text-sm text-plum-600 underline">
        ← Back
      </Link>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Weekly practice</h2>
        <Stepper
          label="Practices per week"
          hint="How many practices keep the streak alive"
          value={child.settings.weeklyTarget}
          min={1}
          max={7}
          onChange={(v) => save(() => updateWeeklyTarget(childId, v))}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Lives</h2>
        <Stepper
          label="Extra practices per life"
          hint="Practices beyond the weekly target needed to bank one life"
          value={child.settings.livesPerSurplus}
          min={1}
          max={7}
          onChange={(v) => save(() => updateLivesConfig(childId, v, child.settings.maxLives))}
        />
        <Stepper
          label="Maximum banked lives"
          hint="A life saves the streak when a week's target is missed"
          value={child.settings.maxLives}
          min={1}
          max={5}
          onChange={(v) => save(() => updateLivesConfig(childId, child.settings.livesPerSurplus, v))}
        />
      </section>

      <SignInCodeSection />

      <Toast message={toast} />
    </div>
  );
}
