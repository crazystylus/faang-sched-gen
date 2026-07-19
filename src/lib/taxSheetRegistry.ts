/**
 * taxSheetRegistry.ts
 *
 * Central registry for RSU/equity tax-sheet import adapters.
 * Each adapter implements the RsuTaxSheetAdapter contract defined in
 * amazonTaxSheet.ts. Adding support for a new employer's tax sheet is as
 * simple as implementing that interface and adding an entry here.
 */

import {
  type RsuTaxSheetAdapter,
  amazonRsuTaxSheetAdapter,
} from "./amazonTaxSheet";

// ─── Re-export the shared adapter type so consumers only need one import ────
export type { RsuTaxSheetAdapter };

/**
 * Ordered list of all registered adapters.
 * Future adapters (e.g. Apple, Google, Meta) can be added here without
 * touching any UI code – the TaxSheetImporter component reads this list
 * at render time.
 */
export const TAX_SHEET_ADAPTERS: RsuTaxSheetAdapter[] = [
  amazonRsuTaxSheetAdapter,

  // ── Placeholder – remove the comment block below and fill in the adapter ──
  // {
  //   id: "apple-rsu-tax-sheet",
  //   label: "Apple RSU Tax Sheet",
  //   accept: ".csv",
  //   importFile: importAppleTaxSheet,
  // },
];

/** Quick O(1) lookup by adapter id. */
export function getAdapterById(id: string): RsuTaxSheetAdapter | undefined {
  return TAX_SHEET_ADAPTERS.find((a) => a.id === id);
}
