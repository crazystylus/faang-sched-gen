import { expect, test } from "bun:test";
import { generateBeancount } from "./beancountExport";

test("exports a balanced Beancount RSU vesting transaction", () => {
  const output = generateBeancount([
    {
      equity: "AMZN",
      units: 20,
      dateOfInvestment: "2024-03-15",
      initialValueUSD: 20 * 150,
      initialValueINR: 250000,
      peakValueINR: 270000,
      closingValueINR: 245000,
      dateOfPeak: "2024-09-01",
      dateOfClosing: "2024-12-31",
    },
  ]);

  expect(output).toContain("2000-01-01 open Assets:Investments:US:AMZN AMZN");
  expect(output).toContain('2024-03-15 * "RSU vesting - AMZN"');
  expect(output).toContain(
    "Assets:Investments:US:AMZN 20 AMZN {150 USD}",
  );
  expect(output).toContain("Income:Employment:RSU -3000 USD");
});

test("comments rather than inventing a vesting value when initial USD is unavailable", () => {
  const output = generateBeancount([
    {
      equity: "AAPL",
      units: 5,
      dateOfInvestment: "2018-06-01",
      peakValueINR: 50000,
      closingValueINR: 45000,
      dateOfPeak: "2018-09-01",
      dateOfClosing: "2018-12-31",
    },
  ]);
  expect(output).toContain("Skipped AAPL vesting on 2018-06-01");
  expect(output).not.toContain("RSU vesting - AAPL");
});
