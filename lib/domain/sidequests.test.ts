import { describe, expect, it } from "vitest";
import { applyStarEarned, getActiveSidequestId, revertStarEarned } from "./sidequests";
import type { Sidequest } from "./types";

function makeQuests(): Sidequest[] {
  return [
    { id: "scales", order: 0, starsEarned: 0, completedAt: null },
    { id: "sight-reading", order: 1, starsEarned: 0, completedAt: null },
    { id: "vibrato", order: 2, starsEarned: 0, completedAt: null },
  ];
}

describe("getActiveSidequestId", () => {
  it("returns the lowest-order incomplete quest", () => {
    expect(getActiveSidequestId(makeQuests())).toBe("scales");
  });

  it("returns null for an empty list", () => {
    expect(getActiveSidequestId([])).toBeNull();
  });

  it("returns null once every quest is complete", () => {
    const quests = makeQuests().map((sq) => ({ ...sq, starsEarned: 3, completedAt: "2026-07-06" }));
    expect(getActiveSidequestId(quests)).toBeNull();
  });

  it("skips completed quests regardless of list order", () => {
    const quests = makeQuests();
    quests[0].completedAt = "2026-07-06";
    quests[0].starsEarned = 3;
    expect(getActiveSidequestId(quests)).toBe("sight-reading");
  });
});

describe("applyStarEarned", () => {
  it("increments stars without completing before the third star", () => {
    const { sidequests, completed } = applyStarEarned(makeQuests(), "scales", "2026-07-06");
    expect(completed).toBe(false);
    expect(sidequests[0]).toMatchObject({ starsEarned: 1, completedAt: null });
  });

  it("completes the quest on the third star", () => {
    let quests = makeQuests();
    quests = applyStarEarned(quests, "scales", "2026-07-06").sidequests;
    quests = applyStarEarned(quests, "scales", "2026-07-08").sidequests;
    const { sidequests, completed } = applyStarEarned(quests, "scales", "2026-07-10");
    expect(completed).toBe(true);
    expect(sidequests[0]).toMatchObject({ starsEarned: 3, completedAt: "2026-07-10" });
  });

  it("advances the active quest once the current one completes", () => {
    let quests = makeQuests();
    for (const date of ["2026-07-06", "2026-07-08", "2026-07-10"]) {
      quests = applyStarEarned(quests, "scales", date).sidequests;
    }
    expect(getActiveSidequestId(quests)).toBe("sight-reading");
  });

  it("does not exceed 3 stars or re-trigger completion", () => {
    let quests = makeQuests();
    for (const date of ["2026-07-06", "2026-07-08", "2026-07-10"]) {
      quests = applyStarEarned(quests, "scales", date).sidequests;
    }
    const { sidequests, completed } = applyStarEarned(quests, "scales", "2026-07-12");
    expect(completed).toBe(false);
    expect(sidequests[0].starsEarned).toBe(3);
  });
});

describe("revertStarEarned", () => {
  it("decrements stars", () => {
    let quests = makeQuests();
    quests = applyStarEarned(quests, "scales", "2026-07-06").sidequests;
    quests = revertStarEarned(quests, "scales");
    expect(quests[0]).toMatchObject({ starsEarned: 0, completedAt: null });
  });

  it("un-marking the day that earned the 3rd star un-completes and restores the quest as active", () => {
    let quests = makeQuests();
    for (const date of ["2026-07-06", "2026-07-08", "2026-07-10"]) {
      quests = applyStarEarned(quests, "scales", date).sidequests;
    }
    expect(getActiveSidequestId(quests)).toBe("sight-reading");

    quests = revertStarEarned(quests, "scales");
    expect(quests[0]).toMatchObject({ starsEarned: 2, completedAt: null });
    expect(getActiveSidequestId(quests)).toBe("scales");
  });

  it("never goes below zero stars", () => {
    const quests = revertStarEarned(makeQuests(), "scales");
    expect(quests[0].starsEarned).toBe(0);
  });
});
