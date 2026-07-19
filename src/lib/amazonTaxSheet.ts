import type { InvestmentInput } from "./computeFA";
import { unzipSync, zipSync } from "fflate";

type TaxSheetRow = Record<string, unknown>;
const maxTaxSheetFileSizeBytes = 20 * 1024 * 1024;
const maxTaxSheetRows = 5_000;

/** Contract for provider-specific RSU tax-sheet importers. */
export interface RsuTaxSheetAdapter {
  id: string;
  label: string;
  accept: string;
  importFile: (file: File) => Promise<InvestmentInput[]>;
}

/**
 * Converts Amazon's Detailed Tax Sheet vest rows to editable Schedule FA inputs.
 * Transaction Date is the vest date; Net Shares to Participant already excludes
 * shares sold through Amazon's "Sell for Taxes" election.
 */
export function parseAmazonTaxSheetRows(
  rows: TaxSheetRow[],
): InvestmentInput[] {
  const rsuRows = rows.filter(
    (row) =>
      String(row["Award Type"] ?? "")
        .trim()
        .toUpperCase() === "RSU",
  );
  if (!rsuRows.length) {
    throw new Error("No RSU rows found in the Amazon tax sheet");
  }

  return rsuRows.flatMap((row, index) => {
    const units = parseNumber(row["Net Shares to Participant"]);
    if (units === 0) return [];
    if (!Number.isFinite(units) || units < 0) {
      throw new Error(`Row ${index + 2}: invalid Net Shares to Participant`);
    }

    const fairMarketValueUSD = parseNumber(row.fmv);
    if (!Number.isFinite(fairMarketValueUSD) || fairMarketValueUSD < 0) {
      throw new Error(`Row ${index + 2}: invalid fmv`);
    }

    return [
      {
        equity: "AMZN",
        units,
        dateOfInvestment: normalizeDate(row["Transaction Date"], index + 2),
        fairMarketValueUSD,
      },
    ];
  });
}

/**
 * XLSX files from some Amazon tax exports contain ZIP64 metadata even though
 * the archive is small and does not require ZIP64. SheetJS 0.18.x has trouble
 * parsing these ZIP entries and can interpret the ZIP64 size fields incorrectly,
 * causing massive allocations (for example, attempting to create a multi-GB
 * string from a tiny XML entry).
 *
 * Normalize the XLSX ZIP container with fflate before passing it to SheetJS.
 * This preserves the workbook contents while rewriting the ZIP metadata into a
 * format SheetJS can safely parse.
 */
export async function importAmazonTaxSheet(
  file: File,
): Promise<InvestmentInput[]> {
  if (file.size > maxTaxSheetFileSizeBytes) {
    throw new Error(
      "The Amazon RSU tax sheet is larger than 20 MB. Export only the relevant vesting rows and try again.",
    );
  }

  // CSV: parse with PapaParse (already a dependency) — avoids loading SheetJS
  // entirely and uses a streaming parser that never holds the full file in
  // memory as a workbook object model.
  if (file.name.toLowerCase().endsWith(".csv")) {
    return importAmazonTaxSheetCsv(file);
  }

  // XLSX / XLS: lazy-load SheetJS only when genuinely needed and pass the
  // ArrayBuffer directly (type: "buffer") so the runtime doesn't need to make
  // an additional Uint8Array copy of the raw bytes.
  const XLSX = await import("xlsx");
  const arrayBuffer = await file.arrayBuffer();
  const files = unzipSync(new Uint8Array(arrayBuffer));
  const normalized = zipSync(files);
  const workbook = XLSX.read(normalized, {
    type: "buffer",
    cellDates: false,
    sheets: 0,
    sheetRows: maxTaxSheetRows,
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName)
    throw new Error("The Amazon tax sheet has no worksheets");
  const rows = XLSX.utils.sheet_to_json<TaxSheetRow>(
    workbook.Sheets[firstSheetName],
    { defval: "", raw: false },
  );
  return parseAmazonTaxSheetRows(rows);
}

/** Parse a CSV tax-sheet export using PapaParse to avoid loading SheetJS.
 *
 * `file.text()` is a native async API (no FileReader) so parsing never blocks
 * the main thread. Passing the resulting string to Papa.parse avoids the
 * internal FileReader / FileReaderSync branch that PapaParse takes when given
 * a File object directly, which is both synchronous and unavailable in Bun.
 */
async function importAmazonTaxSheetCsv(
  file: File,
): Promise<InvestmentInput[]> {
  const text = await file.text();
  const { default: Papa } = await import("papaparse");
  const { data, errors } = Papa.parse<TaxSheetRow>(text, {
    header: true,
    skipEmptyLines: true,
  });
  if (errors.length) {
    throw new Error(`CSV parse error: ${errors[0].message}`);
  }
  return parseAmazonTaxSheetRows(data);
}

/**
 * The first provider adapter. Future providers (for example, Apple) can expose
 * the same contract without changing the investment form.
 */
export const amazonRsuTaxSheetAdapter: RsuTaxSheetAdapter = {
  id: "amazon-rsu-tax-sheet",
  label: "Import Amazon RSU tax sheet",
  accept: ".xlsx,.xls,.csv",
  importFile: importAmazonTaxSheet,
};

function parseNumber(value: unknown): number {
  return Number(
    String(value ?? "")
      .replace(/,/g, "")
      .trim(),
  );
}

function normalizeDate(value: unknown, rowNumber: number): string {
  const text = String(value ?? "").trim();
  const yearFirst = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(text);
  const monthFirst = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/.exec(text);
  if (!yearFirst && !monthFirst)
    throw new Error(`Row ${rowNumber}: invalid Transaction Date`);

  const rawYear = yearFirst?.[1] ?? monthFirst?.[3];
  const year =
    rawYear && rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
  const month = Number(yearFirst?.[2] ?? monthFirst?.[1]);
  const day = Number(yearFirst?.[3] ?? monthFirst?.[2]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`Row ${rowNumber}: invalid Transaction Date`);
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
