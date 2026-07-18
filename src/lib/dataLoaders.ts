import Papa from "papaparse";
import type { DataRow } from "./lookupUtils";

const BASE_PATH = "https://crazystylus.github.io/faang-sched-gen";
const DATA_PATH = process.env.NODE_ENV === "development" ? "" : BASE_PATH;

async function fetchCsv(url: string, label: string): Promise<DataRow[]> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Unable to load ${label} (${response.status})`);
  const parsed = Papa.parse<DataRow>(await response.text(), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length)
    throw new Error(`Unable to parse ${label}: ${parsed.errors[0].message}`);
  if (!parsed.data.length) throw new Error(`${label} is empty`);
  return parsed.data;
}

export function loadForexData(): Promise<DataRow[]> {
  return fetchCsv(
    `${DATA_PATH}/SBI_REFERENCE_RATES_USD.csv`,
    "SBI reference rates",
  );
}

export async function loadStockData(
  equity: string,
  file?: File | FileList | string,
): Promise<DataRow[]> {
  if (file) {
    const selectedFile = isFileList(file) ? file.item(0) : file;
    const text =
      typeof selectedFile === "string"
        ? selectedFile
        : selectedFile
          ? await selectedFile.text()
          : "";
    if (!text.trim()) throw new Error("The custom stock CSV is empty");
    const parsed = Papa.parse<DataRow>(text, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length)
      throw new Error(
        `Unable to parse custom stock CSV: ${parsed.errors[0].message}`,
      );
    if (!parsed.data.length) throw new Error("The custom stock CSV is empty");
    return parsed.data;
  }
  return fetchCsv(
    `${DATA_PATH}/stockData/${encodeURIComponent(equity)}.csv`,
    `${equity} stock data`,
  );
}

function isFileList(value: File | FileList | string): value is FileList {
  return typeof FileList !== "undefined" && value instanceof FileList;
}
