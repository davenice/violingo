import { describe, expect, it } from "vitest";
import { PRACTICE_ENCOURAGEMENTS, pickEncouragement } from "./encouragement";

describe("pickEncouragement", () => {
  it("returns the first entry when random() is 0", () => {
    expect(pickEncouragement(() => 0)).toBe(PRACTICE_ENCOURAGEMENTS[0]);
  });

  it("returns the last entry as random() approaches 1", () => {
    expect(pickEncouragement(() => 0.999999)).toBe(
      PRACTICE_ENCOURAGEMENTS[PRACTICE_ENCOURAGEMENTS.length - 1],
    );
  });

  it("always returns one of the known puns", () => {
    for (const r of [0, 0.1, 0.5, 0.75, 0.99]) {
      expect(PRACTICE_ENCOURAGEMENTS).toContain(pickEncouragement(() => r));
    }
  });
});
