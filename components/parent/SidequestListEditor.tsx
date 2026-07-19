"use client";

import { useState, type FormEvent } from "react";
import type { SidequestWithId } from "@/hooks/useSidequests";
import {
  addSidequest,
  deleteSidequest,
  moveSidequest,
  renameSidequest,
} from "@/lib/firebase/parentActions";

interface SidequestListEditorProps {
  childId: string;
  sidequests: SidequestWithId[];
  activeSidequestId: string | null;
  onSaved: (message: string) => void;
}

function QuestRow({
  childId,
  quest,
  sidequests,
  isActive,
  isFirst,
  isLast,
  busy,
  setBusy,
  onSaved,
}: {
  childId: string;
  quest: SidequestWithId;
  sidequests: SidequestWithId[];
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(quest.name);
  const completed = quest.completedAt !== null;

  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    try {
      await action();
      onSaved(message);
    } catch {
      onSaved("Couldn't save that — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li
      className={`flex items-center gap-2 rounded-xl border p-2 ${
        isActive ? "border-coral-200 bg-coral-50" : "border-zinc-200"
      } ${completed ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col">
        <button
          type="button"
          disabled={busy || isFirst}
          onClick={() => run(() => moveSidequest(childId, sidequests, quest.id, -1), "Moved up")}
          aria-label={`Move ${quest.name} up`}
          className="px-1 text-xs disabled:opacity-20"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={busy || isLast}
          onClick={() => run(() => moveSidequest(childId, sidequests, quest.id, 1), "Moved down")}
          aria-label={`Move ${quest.name} down`}
          className="px-1 text-xs disabled:opacity-20"
        >
          ▼
        </button>
      </div>
      <input
        value={name}
        disabled={busy}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim();
          if (trimmed && trimmed !== quest.name) {
            void run(() => renameSidequest(childId, quest.id, trimmed), "Renamed");
          } else {
            setName(quest.name);
          }
        }}
        aria-label={`Sidequest name`}
        className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 focus:border-zinc-300 focus:bg-white"
      />
      <span className="text-sm" aria-label={`${quest.starsEarned} of 3 stars`}>
        {completed ? "🏅" : `${quest.starsEarned}⭐`}
      </span>
      {isActive && <span className="rounded-full bg-coral-100 px-2 py-0.5 text-xs">active</span>}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (window.confirm(`Delete "${quest.name}"?`)) {
            void run(() => deleteSidequest(childId, sidequests, quest.id), "Deleted");
          }
        }}
        aria-label={`Delete ${quest.name}`}
        className="px-2 text-zinc-400 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  );
}

export function SidequestListEditor({
  childId,
  sidequests,
  activeSidequestId,
  onSaved,
}: SidequestListEditorProps) {
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const sorted = [...sidequests].sort((a, b) => a.order - b.order);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await addSidequest(childId, sidequests, name);
      setNewName("");
      onSaved("Sidequest added");
    } catch {
      onSaved("Couldn't save that — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No sidequests yet. Add practice targets like &ldquo;G major scale&rdquo; — your child works
          through them in order, earning three stars each.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((quest, i) => (
            <QuestRow
              key={quest.id}
              childId={childId}
              quest={quest}
              sidequests={sidequests}
              isActive={quest.id === activeSidequestId}
              isFirst={i === 0}
              isLast={i === sorted.length - 1}
              busy={busy}
              setBusy={setBusy}
              onSaved={onSaved}
            />
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newName}
          disabled={busy}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New sidequest, e.g. Sight reading"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="rounded-lg bg-plum-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );
}
