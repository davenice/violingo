import type { SidequestWithId } from "@/hooks/useSidequests";

interface SidequestCardProps {
  sidequests: SidequestWithId[];
  activeSidequestId: string | null;
  todayPracticed: boolean;
  todayTaggedSidequestId: string | null;
  onTagToday: (sidequestId: string) => void;
  busy: boolean;
}

function Stars({ earned }: { earned: number }) {
  return (
    <span className="text-lg" aria-label={`${earned} of 3 stars`}>
      {Array.from({ length: 3 }, (_, i) => (
        <span key={i} className={i < earned ? "" : "opacity-25 grayscale"}>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function SidequestCard({
  sidequests,
  activeSidequestId,
  todayPracticed,
  todayTaggedSidequestId,
  onTagToday,
  busy,
}: SidequestCardProps) {
  const active = sidequests.find((sq) => sq.id === activeSidequestId) ?? null;
  const upNext = sidequests.filter((sq) => sq.completedAt === null && sq.id !== active?.id);
  const done = sidequests.filter((sq) => sq.completedAt !== null);

  if (sidequests.length === 0) {
    return (
      <section className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Sidequests</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ask a grown-up to add sidequests in Parent settings.
        </p>
      </section>
    );
  }

  // The day's star may belong to a quest that's since been completed; show the
  // tag state for whichever quest today is tagged with.
  const todayTagged = todayTaggedSidequestId !== null;
  const taggedQuest = todayTagged
    ? sidequests.find((sq) => sq.id === todayTaggedSidequestId)
    : null;
  const buttonQuest = taggedQuest ?? active;

  return (
    <section className="w-full max-w-md rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Sidequests</h2>

      {active === null && upNext.length === 0 ? (
        <p className="mt-1 text-sm text-emerald-700">All sidequests complete — amazing! 🎉</p>
      ) : (
        active && (
          <div className="mt-2 flex items-center justify-between rounded-xl bg-coral-50 p-3">
            <div>
              <p className="font-medium text-coral-800">{active.name}</p>
              {active.description && <p className="text-xs text-coral-700">{active.description}</p>}
            </div>
            <Stars earned={active.starsEarned} />
          </div>
        )
      )}

      {buttonQuest && (
        <button
          disabled={busy || !todayPracticed}
          onClick={() => onTagToday(buttonQuest.id)}
          className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40 ${
            todayTagged
              ? "bg-emerald-100 text-emerald-800"
              : "bg-coral-400 text-white hover:bg-coral-500"
          }`}
        >
          {todayTagged
            ? `⭐ Worked on ${taggedQuest?.name ?? "sidequest"} today — tap to undo`
            : todayPracticed
              ? `I worked on ${buttonQuest.name} today!`
              : "Practice today to earn a sidequest star"}
        </button>
      )}

      {upNext.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium text-zinc-400">Up next</p>
          <ul className="mt-1 space-y-1">
            {upNext.map((sq) => (
              <li key={sq.id} className="text-sm text-zinc-500">
                {sq.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {done.length > 0 && (
        <p className="mt-3 text-xs text-zinc-400">
          Completed: {done.map((sq) => sq.name).join(", ")} 🏅
        </p>
      )}
    </section>
  );
}
