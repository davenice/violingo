import { describe, expect, it } from "vitest";
import {
  addDays,
  addWeeks,
  getDateKey,
  getWeekDates,
  getWeekStart,
  weekdayIndexOfKey,
  weekStartOfKey,
} from "./dates";

describe("getWeekStart", () => {
  it("returns the same date when it's already a Monday", () => {
    expect(getWeekStart(new Date("2026-07-06T12:00:00Z"), "UTC")).toBe("2026-07-06");
  });

  it("returns the preceding Monday for a mid-week date", () => {
    expect(getWeekStart(new Date("2026-07-09T12:00:00Z"), "UTC")).toBe("2026-07-06");
  });

  it("returns the preceding Monday for a Sunday", () => {
    expect(getWeekStart(new Date("2026-07-12T12:00:00Z"), "UTC")).toBe("2026-07-06");
  });

  it("is timezone-aware across a UTC day boundary", () => {
    // 2026-07-12 23:30 UTC is already 2026-07-13 (Monday) in Europe/London (BST, UTC+1)
    const date = new Date("2026-07-12T23:30:00Z");
    expect(getWeekStart(date, "Europe/London")).toBe("2026-07-13");
    expect(getWeekStart(date, "UTC")).toBe("2026-07-06");
  });

  it("handles a timezone behind UTC crossing a month boundary", () => {
    // 2026-08-03 05:00 UTC is still 2026-08-02 (Sunday) in America/Los_Angeles (PDT, UTC-7)
    const date = new Date("2026-08-03T05:00:00Z");
    expect(getWeekStart(date, "America/Los_Angeles")).toBe("2026-07-27");
  });
});

describe("addWeeks", () => {
  it("adds whole weeks forward", () => {
    expect(addWeeks("2026-07-06", 1)).toBe("2026-07-13");
    expect(addWeeks("2026-07-06", 3)).toBe("2026-07-27");
  });

  it("adds weeks backward", () => {
    expect(addWeeks("2026-07-06", -1)).toBe("2026-06-29");
  });

  it("is a no-op for zero weeks", () => {
    expect(addWeeks("2026-07-06", 0)).toBe("2026-07-06");
  });

  it("crosses a year boundary correctly", () => {
    expect(addWeeks("2025-12-29", 1)).toBe("2026-01-05");
  });
});

describe("addDays", () => {
  it("adds days across a month boundary", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
  });

  it("subtracts days", () => {
    expect(addDays("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("getDateKey", () => {
  it("returns the local day for a timezone ahead of UTC", () => {
    // 23:30 UTC is already the next day in London during BST
    expect(getDateKey(new Date("2026-07-12T23:30:00Z"), "Europe/London")).toBe("2026-07-13");
    expect(getDateKey(new Date("2026-07-12T23:30:00Z"), "UTC")).toBe("2026-07-12");
  });
});

describe("weekStartOfKey", () => {
  it("returns the same key for a Monday", () => {
    expect(weekStartOfKey("2026-07-06")).toBe("2026-07-06");
  });

  it("returns the preceding Monday for a Sunday", () => {
    expect(weekStartOfKey("2026-07-12")).toBe("2026-07-06");
  });

  it("agrees with getWeekStart for the same local day", () => {
    const date = new Date("2026-07-09T12:00:00Z");
    const key = getDateKey(date, "Europe/London");
    expect(weekStartOfKey(key)).toBe(getWeekStart(date, "Europe/London"));
  });
});

describe("getWeekDates", () => {
  it("returns seven consecutive days from the week start", () => {
    expect(getWeekDates("2026-07-06")).toEqual([
      "2026-07-06",
      "2026-07-07",
      "2026-07-08",
      "2026-07-09",
      "2026-07-10",
      "2026-07-11",
      "2026-07-12",
    ]);
  });
});

describe("weekdayIndexOfKey", () => {
  it("maps Monday to 0 and Sunday to 6", () => {
    expect(weekdayIndexOfKey("2026-07-06")).toBe(0); // Monday
    expect(weekdayIndexOfKey("2026-07-10")).toBe(4); // Friday
    expect(weekdayIndexOfKey("2026-07-12")).toBe(6); // Sunday
  });
});
