import { expect, test } from "bun:test";
import * as XLSX from "xlsx";
import {
  importAmazonTaxSheet,
  parseAmazonTaxSheetRows,
} from "./amazonTaxSheet";

test("imports Amazon RSUs using vest date, FMV, and post-tax net shares", () => {
  const [investment] = parseAmazonTaxSheetRows([
    {
      "Award Type": "RSU",
      "Transaction Date": "2024/03/15",
      "Net Shares to Participant": "20",
      fmv: "150.00",
      "Tax Election": "Sell for Taxes",
      "Shares Sold": "8",
    },
  ]);

  expect(investment).toEqual({
    equity: "AMZN",
    units: 20,
    dateOfInvestment: "2024-03-15",
    fairMarketValueUSD: 150,
  });
});

test("does not create a holding when no shares remain after sell-to-cover", () => {
  expect(
    parseAmazonTaxSheetRows([
      {
        "Award Type": "RSU",
        "Transaction Date": "2024/03/15",
        "Net Shares to Participant": "0",
        fmv: "150.00",
      },
    ]),
  ).toEqual([]);
});

test("accepts the month-first date emitted by the spreadsheet parser", () => {
  const [investment] = parseAmazonTaxSheetRows([
    {
      "Award Type": "RSU",
      "Transaction Date": "3/15/24",
      "Net Shares to Participant": "1",
      fmv: "150",
    },
  ]);
  expect(investment.dateOfInvestment).toBe("2024-03-15");
});

test("reads a CSV tax-sheet export through the file importer", async () => {
  const file = new File(
    [
      [
        "Award Type,Transaction Date,Net Shares to Participant,fmv",
        "RSU,2024/03/15,20,150.00",
      ].join("\n"),
    ],
    "amazon-rsu.csv",
    { type: "text/csv" },
  );
  const [investment] = await importAmazonTaxSheet(file);
  expect(investment.dateOfInvestment).toBe("2024-03-15");
  expect(investment.units).toBe(20);
});

test("reads a binary XLSX tax-sheet export through the file importer", async () => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([
    ["Award Type", "Transaction Date", "Net Shares to Participant", "fmv"],
    ["RSU", "2024/03/15", 20, 150],
  ]);
  XLSX.utils.book_append_sheet(workbook, worksheet, "Vesting");
  const file = new File(
    [XLSX.write(workbook, { bookType: "xlsx", type: "array" })],
    "amazon-rsu.xlsx",
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );
  const [investment] = await importAmazonTaxSheet(file);
  expect(investment).toMatchObject({
    equity: "AMZN",
    units: 20,
    dateOfInvestment: "2024-03-15",
    fairMarketValueUSD: 150,
  });
});
