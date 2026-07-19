import { describe, expect, test } from "bun:test";
import { computeScheduleFA, getReportingYear } from "./computeFA";
import { getTTBuyRateOnDate, parseCalendarDate } from "./lookupUtils";

const forex = [
  { Date: "2023-05-10 09:00", "TT BUY": "80.00" },
  { Date: "2024-01-05 09:00", "TT BUY": "83.00" },
  { Date: "2024-01-06 09:00", "TT BUY": "0.00" },
  { Date: "2024-01-08 09:00", "TT BUY": "83.20" },
  { Date: "2024-12-30 09:00", "TT BUY": "85.00" },
];

const stock = [
  { Date: "05/10/2023", "Close/Last": "$90", High: "$91" },
  { Date: "01/05/2024", "Close/Last": "$100", High: "$110" },
  { Date: "01/08/2024", "Close/Last": "$105", High: "$120" },
  { Date: "12/30/2024", "Close/Last": "$130", High: "$131" },
];

const dependencies = {
  loadForexData: async () => forex,
  loadStockData: async () => stock,
};

describe("SBI TT Buy lookup", () => {
  test("uses the preceding positive SBI rate when the acquisition date is a bank holiday", () => {
    expect(getTTBuyRateOnDate(forex, parseCalendarDate("2024-01-06"))).toBe(83);
  });

  test("does not silently invent a conversion rate when no rate exists", () => {
    expect(() =>
      getTTBuyRateOnDate([], parseCalendarDate("2024-01-06")),
    ).toThrow("No positive SBI TT Buy rate");
  });
});

describe("Schedule FA computation", () => {
  test("uses prior SBI rate for a weekend vest and computes initial, peak, and closing values", async () => {
    const [result] = await computeScheduleFA(
      {
        assessmentYear: "2025-2026",
        investments: [
          { equity: "AAPL", units: 2, dateOfInvestment: "2024-01-06" },
        ],
      },
      dependencies,
    );
    expect(result).toEqual({
      equity: "AAPL",
      units: 2,
      dateOfInvestment: "2024-01-06",
      initialValueUSD: 200,
      initialValueINR: 16600,
      peakValueINR: 22270,
      dateOfPeak: "2024-12-30",
      closingValueINR: 22100,
      dateOfClosing: "2024-12-30",
    });
  });

  test("calculates an initial value for an asset acquired before the reporting year when source data is available", async () => {
    const [result] = await computeScheduleFA(
      {
        assessmentYear: "2025-2026",
        investments: [
          { equity: "AAPL", units: 1, dateOfInvestment: "2023-05-10" },
        ],
      },
      dependencies,
    );
    expect(result.initialValueUSD).toBe(90);
    expect(result.initialValueINR).toBe(7200);
    expect(result.peakValueINR).toBe(11135);
  });

  test("leaves the initial value blank only when the acquisition predates available source data", async () => {
    const [result] = await computeScheduleFA(
      {
        assessmentYear: "2025-2026",
        investments: [
          { equity: "AAPL", units: 1, dateOfInvestment: "2019-05-10" },
        ],
      },
      dependencies,
    );
    expect(result.initialValueINR).toBeUndefined();
    expect(result.initialValueUSD).toBeUndefined();
    expect(result.peakValueINR).toBe(11135);
  });

  test("treats a blank optional FMV as absent and falls back to the stock close", async () => {
    const [result] = await computeScheduleFA(
      {
        assessmentYear: "2025-2026",
        investments: [
          {
            equity: "AAPL",
            units: 1,
            dateOfInvestment: "2024-01-05",
            fairMarketValueUSD: Number.NaN,
          },
        ],
      },
      dependencies,
    );
    expect(result.initialValueUSD).toBe(100);
    expect(result.initialValueINR).toBe(8300);
  });

  test("rejects invalid units and malformed assessment years", async () => {
    await expect(
      computeScheduleFA(
        {
          assessmentYear: "2025-2026",
          investments: [
            { equity: "AAPL", units: 0, dateOfInvestment: "2024-01-05" },
          ],
        },
        dependencies,
      ),
    ).rejects.toThrow("units must be greater than zero");
    expect(() => getReportingYear("2025-2027")).toThrow(
      "valid assessment year",
    );
  });
});
