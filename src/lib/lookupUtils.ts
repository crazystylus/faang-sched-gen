// lib/lookupUtils.ts

import { isSameDay, isAfter } from "date-fns";

export function getUSDValueOnDate(
  data: any[],
  targetDate: Date,
  column: string,
): number {
  const dateStr = targetDate.toISOString().split("T")[0];
  const row = findClosestOnOrBefore(data, dateStr);
  const val = parseFloat(row[column].replace("$", ""));
  console.log(`Lookup USD value on ${dateStr}: ${val}`);
  return val;
}

export function getTTBuyRateOnDate(data: any[], targetDate: Date): number {
  const dateStr = targetDate.toISOString().split("T")[0];
  const row = findClosestOnOrBefore(data, dateStr);
  return parseFloat(row["TT BUY"]);
}

function findClosestOnOrBefore(data: any[], dateStr: string): any {
  const date = new Date(dateStr);
  const sorted = [...data].sort((a, b) =>
    isAfter(new Date(b.Date), date) ? 1 : -1,
  );
  const res = sorted.find((r) => isSameDay(new Date(r.Date), date));
  console.log(res);
  return res;
}
