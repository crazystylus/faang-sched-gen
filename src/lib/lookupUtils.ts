export type DataRow = Record<string, string | number | undefined>;

/** Parses a calendar date without applying the browser's local timezone. */
export function parseCalendarDate(value: string | Date): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new Error("Invalid date");
    return new Date(
      Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
    );
  }

  const text = value.trim();
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  const usMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : usMatch
      ? [Number(usMatch[3]), Number(usMatch[1]), Number(usMatch[2])]
      : null;
  if (!parts) throw new Error(`Invalid date: ${value}`);

  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }
  return date;
}

export function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseCurrency(value: unknown, label: string): number {
  const normalized = String(value ?? "").replace(/[$,\s]/g, "");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) throw new Error(`Missing or invalid ${label}`);
  return parsed;
}

/** Returns the latest row dated on or before the requested calendar date. */
export function findClosestOnOrBefore<T extends DataRow>(
  data: T[],
  targetDate: Date,
): T | undefined {
  const target = targetDate.getTime();
  return data
    .map((row) => ({ row, date: getRowDate(row) }))
    .filter(
      (entry): entry is { row: T; date: Date } =>
        entry.date !== undefined && entry.date.getTime() <= target,
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.row;
}

export function getUSDValueOnDate(
  data: DataRow[],
  targetDate: Date,
  column: string,
): number {
  const row = findClosestOnOrBefore(data, targetDate);
  if (!row)
    throw new Error(
      `No stock price on or before ${formatCalendarDate(targetDate)}`,
    );
  const value = parseCurrency(row[column], `${column} price`);
  if (value < 0) throw new Error(`Invalid ${column} price`);
  return value;
}

/**
 * SBI does not publish a usable TT Buy rate on bank holidays. Use the last
 * preceding published, positive rate; never substitute an arbitrary rate.
 */
export function getTTBuyRateOnDate(data: DataRow[], targetDate: Date): number {
  const candidates = data
    .map((row) => ({ row, date: getRowDate(row) }))
    .filter(
      (entry): entry is { row: DataRow; date: Date } =>
        entry.date !== undefined &&
        entry.date.getTime() <= targetDate.getTime(),
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const { row } of candidates) {
    const rate = Number(String(row["TT BUY"] ?? "").replace(/,/g, ""));
    if (Number.isFinite(rate) && rate > 0) return rate;
  }
  throw new Error(
    `No positive SBI TT Buy rate on or before ${formatCalendarDate(targetDate)}`,
  );
}

export function getRowDate(row: DataRow): Date | undefined {
  const value = row.Date ?? row.date;
  if (typeof value !== "string") return undefined;
  try {
    return parseCalendarDate(value);
  } catch {
    return undefined;
  }
}
