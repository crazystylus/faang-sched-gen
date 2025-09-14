// lib/computeFA.ts
import { isWithinInterval, isAfter, isBefore, isSameDay } from "date-fns";
import { InvestmentResult } from "./scheduleFAExport";
import { loadStockData, loadForexData } from "./dataLoaders";
import { getUSDValueOnDate, getTTBuyRateOnDate } from "./lookupUtils";

export async function computeScheduleFA(
    input: any,
): Promise<InvestmentResult[]> {
    const reportingYear = getReportingYear(input.assessmentYear); // e.g. 2024
    const startDate = new Date(`${reportingYear}-01-01`);
    const endDate = new Date(`${reportingYear}-12-31`);

    const forexData = await loadForexData();

    const results: InvestmentResult[] = [];

    for (const inv of input.investments) {
        const equity = inv.equity;
        const stockData = await loadStockData(equity, inv.customCSV); // handles FAANG or custom
        const investmentDate = new Date(inv.dateOfInvestment);

        let initialValueUSD: number | undefined = undefined;
        let initialValueINR: number | undefined = undefined;

        console.log(
            `Processing investment in ${equity} on ${inv.dateOfInvestment}, isOldAsset: ${inv.isOldAsset}, FMV: ${inv.fairMarketValueUSD}, units: ${inv.units}`,
        );
        // Initial Value Logic
        if (!inv.isOldAsset) {
            if (
                inv.fairMarketValueUSD !== undefined &&
                inv.fairMarketValueUSD !== null &&
                inv.fairMarketValueUSD !== 0
            ) {
                initialValueUSD = inv.fairMarketValueUSD * inv.units;
            } else {
                const price = getUSDValueOnDate(
                    stockData,
                    investmentDate,
                    "Close/Last",
                );
                initialValueUSD = price * inv.units;
            }

            const rate = getTTBuyRateOnDate(forexData, investmentDate);
            initialValueINR = initialValueUSD * rate;
        }

        // Peak Value Logic
        const peakDay = stockData
            .filter((d) => {
                const dDate = new Date(d.Date);
                return isWithinInterval(dDate, { start: investmentDate, end: endDate });
            })
            .reduce((peak, curr) =>
                parseFloat(curr.High) > parseFloat(peak.High) ? curr : peak,
            );

        console.log(
            `Peak day for ${equity} between ${investmentDate.toISOString()} and ${endDate.toISOString()}: ${JSON.stringify(peakDay)}`,
        );
        const peakValueUSD = parseFloat(peakDay.High.replace("$", "")) * inv.units;
        const peakRate = getTTBuyRateOnDate(forexData, new Date(peakDay.Date));
        const peakValueINR = peakValueUSD * peakRate;

        // Closing Value
        const closingDay = getLastTradingDayOnOrBefore(stockData, endDate);
        const closingValueUSD =
            parseFloat(closingDay["Close/Last"].replace("$", "")) * inv.units;
        console.log(
            `Closing day for ${equity} on or before ${endDate.toISOString()}: ${JSON.stringify(closingDay)}`,
        );
        const closingRate = getTTBuyRateOnDate(
            forexData,
            new Date(closingDay.Date),
        );
        const closingValueINR = closingValueUSD * closingRate;

        results.push({
            equity,
            units: inv.units,
            dateOfInvestment: inv.dateOfInvestment,
            initialValueINR,
            peakValueINR,
            dateOfPeak: peakDay.date,
            closingValueINR,
            dateOfClosing: closingDay.date,
        });
    }

    return results;
}

// Helpers
function getReportingYear(assessmentYear: string): number {
    // "2025-2026" → 2024
    return parseInt(assessmentYear.split("-")[0]) - 1;
}

function getLastTradingDayOnOrBefore(stockData: any[], date: Date) {
    return [...stockData].find(
        (d) =>
            isSameDay(new Date(d.Date), date) || isBefore(new Date(d.Date), date),
    );
}
