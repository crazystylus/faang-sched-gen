import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";

const stockSymbols = ["AAPL", "AMZN", "GOOGL", "META", "MSFT", "NFLX"];
const dataStartYear = 2020;

describe("committed market data", () => {
  test("contains a usable SBI TT Buy data set from 2020 onward", async () => {
    const [header, ...rows] = (
      await readFile("public/SBI_REFERENCE_RATES_USD.csv", "utf8")
    )
      .trim()
      .split(/\r?\n/);
    expect(header).toContain("Date");
    expect(header).toContain("TT BUY");
    expect(rows.length).toBeGreaterThan(100);
    expect(new Date(rows[0]?.split(",")[0] ?? "").getUTCFullYear()).toBe(
      dataStartYear,
    );
    expect(rows.some((row) => Number(row.split(",")[2]) > 0)).toBe(true);
  });

  for (const symbol of stockSymbols) {
    test(`${symbol} has usable daily prices from 2020 onward`, async () => {
      const [header, ...rows] = (
        await readFile(`public/stockData/${symbol}.csv`, "utf8")
      )
        .trim()
        .split(/\r?\n/);
      expect(header).toBe("Date,Close/Last,Volume,Open,High,Low");
      expect(rows.length).toBeGreaterThan(100);
      expect(
        new Date(rows.at(-1)?.split(",")[0] ?? "").getTime(),
      ).not.toBeNaN();
      expect(new Date(rows.at(-1)?.split(",")[0] ?? "").getUTCFullYear()).toBe(
        dataStartYear,
      );
      expect(
        rows.every((row) => {
          const [, close, volume, open, high, low] = row.split(",");
          return [close, volume, open, high, low].every(
            (value) => Number(value.replace("$", "")) > 0,
          );
        }),
      ).toBe(true);
    });
  }
});
