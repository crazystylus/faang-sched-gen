// lib/dataLoaders.ts
import Papa from "papaparse";
const BASE_PATH = 'https://crazystylus.github.io/faang-sched-gen';

export async function loadForexData(): Promise<any[]> {
  const res = await fetch(`${BASE_PATH}/SBI_REFERENCE_RATES_USD.csv`);
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true });
  return parsed.data;
}

export async function loadStockData(
  equity: string,
  file?: File,
): Promise<any[]> {
  if (file) {
    const text = await file.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return parsed.data.map((row: any) => ({
      date: normalizeDate(row.Date),
      ...row,
    }));
  } else {
    const res = await fetch(`${BASE_PATH}/stockData/${equity}.csv`);
    const text = await res.text();
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    return parsed.data.map((row: any) => ({
      date: normalizeDate(row.Date),
      ...row,
    }));
  }
}

function normalizeDate(dateStr: string): string {
  // Convert MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = dateStr.split("/");
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}
