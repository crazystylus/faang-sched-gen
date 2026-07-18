import { expect, test } from "bun:test";
import {
  generateScheduleFACSV,
  type InvestmentResult,
  sortInvestmentResultsByDate,
} from "./scheduleFAExport";

const investments: InvestmentResult[] = [
  {
    equity: "AAPL",
    units: 1,
    dateOfInvestment: "2024-01-05",
    initialValueINR: 100,
    peakValueINR: 110,
    closingValueINR: 105,
    dateOfPeak: "2024-01-08",
    dateOfClosing: "2024-12-30",
  },
  {
    equity: "MSFT",
    units: 1,
    dateOfInvestment: "2024-10-05",
    initialValueINR: 200,
    peakValueINR: 210,
    closingValueINR: 205,
    dateOfPeak: "2024-11-08",
    dateOfClosing: "2024-12-30",
  },
];

test("sorts results and CSV rows by latest acquisition date first", () => {
  expect(
    sortInvestmentResultsByDate(investments).map((item) => item.equity),
  ).toEqual(["MSFT", "AAPL"]);

  const [, firstRow, secondRow] =
    generateScheduleFACSV(investments).split("\n");
  expect(firstRow).toContain("Microsoft Corp");
  expect(secondRow).toContain("Apple Inc");
});
