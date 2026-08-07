const ISO_WEEKDAY: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

function formatDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the Monday ('YYYY-MM-DD') of the calendar week containing `date`, in `timeZone`. */
export function getWeekStart(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(date);

  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const localDate = new Date(`${map.year}-${map.month}-${map.day}T00:00:00Z`);
  const isoWeekday = ISO_WEEKDAY[map.weekday];
  localDate.setUTCDate(localDate.getUTCDate() - (isoWeekday - 1));
  return formatDateKey(localDate);
}

/** Shifts a 'YYYY-MM-DD' week-start key by `n` weeks (may be negative). */
export function addWeeks(weekStart: string, n: number): string {
  return addDays(weekStart, n * 7);
}

/** Shifts a 'YYYY-MM-DD' key by `n` days (may be negative). */
export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + n);
  return formatDateKey(date);
}

/** The calendar day ('YYYY-MM-DD') of `date` as observed in `timeZone`. */
export function getDateKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** The Monday ('YYYY-MM-DD') of the calendar week containing the given day key. */
export function weekStartOfKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const isoWeekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (isoWeekday - 1));
  return formatDateKey(date);
}

/** The seven day keys (Mon..Sun) of the week starting at `weekStart`. */
export function getWeekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Weekday index of a day key, Monday = 0 .. Sunday = 6. */
export function weekdayIndexOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}
