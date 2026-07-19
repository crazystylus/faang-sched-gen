import { loadForexData, loadStockData } from "./dataLoaders";
import {
  type DataRow,
  formatCalendarDate,
  getRowDate,
  getTTBuyRateOnDate,
  getUSDValueOnDate,
  parseCalendarDate,
  parseCurrency,
} from "./lookupUtils";
import type { InvestmentResult } from "./scheduleFAExport";

export interface InvestmentInput {
  equity: string;
  units: number;
  dateOfInvestment: string | Date;
  fairMarketValueUSD?: number;
  customCSV?: File | FileList | string;
}

export interface ScheduleFAInput {
  assessmentYear: string;
  investments: InvestmentInput[];
}

export interface ComputeDependencies {
  loadForexData: () => Promise<DataRow[]>;
  loadStockData: (
    equity: string,
    file?: File | FileList | string,
  ) => Promise<DataRow[]>;
}

const defaultDependencies: ComputeDependencies = {
  loadForexData,
  loadStockData,
};

export async function computeScheduleFA(
  input: ScheduleFAInput,
  dependencies = defaultDependencies,
): Promise<InvestmentResult[]> {
  const reportingYear = getReportingYear(input.assessmentYear);
  const startDate = parseCalendarDate(`${reportingYear}-01-01`);
  const endDate = parseCalendarDate(`${reportingYear}-12-31`);
  if (!Array.isArray(input.investments) || input.investments.length === 0)
    throw new Error("Add at least one investment");

  const forexData = await dependencies.loadForexData();
  const results: InvestmentResult[] = [];
  for (const investment of input.investments) {
    validateInvestment(investment);
    const investmentDate = parseCalendarDate(investment.dateOfInvestment);
    if (investmentDate > endDate) continue;

    const stockData = await dependencies.loadStockData(
      investment.equity,
      investment.customCSV,
    );
    const isOldAsset = investmentDate < startDate;
    const firstRelevantDate = isOldAsset ? startDate : investmentDate;
    const periodRows = stockData.filter((row) => {
      const date = getRowDate(row);
      return date !== undefined && date >= firstRelevantDate && date <= endDate;
    });
    if (!periodRows.length)
      throw new Error(
        `${investment.equity}: no stock prices in the reporting period`,
      );

    const peakDay = periodRows.reduce((peak, row) =>
      parseCurrency(row.High, "High price") >
      parseCurrency(peak.High, "High price")
        ? row
        : peak,
    );
    const peakDate = getRowDate(peakDay);
    if (!peakDate) throw new Error(`${investment.equity}: invalid peak date`);
    const closingDay = findLastTradingDay(stockData, endDate);
    if (!closingDay)
      throw new Error(
        `${investment.equity}: no closing price on or before ${formatCalendarDate(endDate)}`,
      );
    const closingDate = getRowDate(closingDay);
    if (!closingDate)
      throw new Error(`${investment.equity}: invalid closing date`);

    const initialValue = canCalculateInitialValue(
      investment,
      stockData,
      forexData,
      investmentDate,
    )
      ? calculateInitialValue(investment, stockData, forexData, investmentDate)
      : undefined;
    const peakValueINR =
      parseCurrency(peakDay.High, "High price") *
      investment.units *
      getTTBuyRateOnDate(forexData, peakDate);
    const closingValueINR =
      parseCurrency(closingDay["Close/Last"], "Close/Last price") *
      investment.units *
      getTTBuyRateOnDate(forexData, closingDate);
    results.push({
      equity: investment.equity,
      units: investment.units,
      dateOfInvestment: formatCalendarDate(investmentDate),
      initialValueUSD: initialValue?.usd,
      initialValueINR: initialValue?.inr,
      peakValueINR,
      dateOfPeak: formatCalendarDate(peakDate),
      closingValueINR,
      dateOfClosing: formatCalendarDate(closingDate),
    });
  }
  return results;
}

function calculateInitialValue(
  investment: InvestmentInput,
  stockData: DataRow[],
  forexData: DataRow[],
  date: Date,
): { usd: number; inr: number } {
  const unitPrice = !hasFairMarketValue(investment)
    ? getUSDValueOnDate(stockData, date, "Close/Last")
    : investment.fairMarketValueUSD;
  if (!Number.isFinite(unitPrice) || unitPrice < 0)
    throw new Error(
      `${investment.equity}: fair market value must be zero or greater`,
    );
  const usd = unitPrice * investment.units;
  return {
    usd,
    inr: usd * getTTBuyRateOnDate(forexData, date),
  };
}

/**
 * Historic initial values are left blank only when the source data predates the
 * committed data set. Other invalid price/rate data remains an explicit error.
 */
function canCalculateInitialValue(
  investment: InvestmentInput,
  stockData: DataRow[],
  forexData: DataRow[],
  investmentDate: Date,
): boolean {
  const firstForexRateDate = earliestDate(forexData, (row) => {
    const rate = Number(String(row["TT BUY"] ?? "").replace(/,/g, ""));
    return Number.isFinite(rate) && rate > 0;
  });
  if (!firstForexRateDate || investmentDate < firstForexRateDate) return false;

  if (hasFairMarketValue(investment)) return true;
  const firstStockDate = earliestDate(stockData, () => true);
  return firstStockDate !== undefined && investmentDate >= firstStockDate;
}

function hasFairMarketValue(investment: InvestmentInput): boolean {
  const value = investment.fairMarketValueUSD;
  return value !== undefined && value !== null && !Number.isNaN(value);
}

function earliestDate(
  data: DataRow[],
  include: (row: DataRow) => boolean,
): Date | undefined {
  return data
    .filter(include)
    .map(getRowDate)
    .filter((date): date is Date => date !== undefined)
    .sort((a, b) => a.getTime() - b.getTime())[0];
}

function findLastTradingDay(
  data: DataRow[],
  endDate: Date,
): DataRow | undefined {
  return data
    .map((row) => ({ row, date: getRowDate(row) }))
    .filter(
      (entry): entry is { row: DataRow; date: Date } =>
        entry.date !== undefined && entry.date <= endDate,
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0]?.row;
}

function validateInvestment(investment: InvestmentInput): void {
  if (!investment.equity?.trim()) throw new Error("Select an equity");
  if (!Number.isFinite(investment.units) || investment.units <= 0)
    throw new Error(`${investment.equity}: units must be greater than zero`);
  if (investment.equity === "Other" && !investment.customCSV)
    throw new Error("Other: upload a stock price CSV");
}

export function getReportingYear(assessmentYear: string): number {
  const match = /^(\d{4})-(\d{4})$/.exec(assessmentYear);
  if (!match || Number(match[2]) !== Number(match[1]) + 1)
    throw new Error("Select a valid assessment year");
  return Number(match[1]) - 1;
}
