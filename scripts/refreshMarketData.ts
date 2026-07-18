import { mkdir, writeFile } from "node:fs/promises";

const symbols = ["AAPL", "AMZN", "MSFT", "GOOGL", "META", "NFLX"];
const stockDirectory = "public/stockData";
const sbiSource =
  "https://raw.githubusercontent.com/sahilgupta/sbi-fx-ratekeeper/main/csv_files/SBI_REFERENCE_RATES_USD.csv";

interface YahooChartResponse {
  chart: {
    error: { description?: string } | null;
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          close: Array<number | null>;
          high: Array<number | null>;
          low: Array<number | null>;
          open: Array<number | null>;
          volume: Array<number | null>;
        }>;
      };
    }> | null;
  };
}

async function refresh(): Promise<void> {
  await mkdir(stockDirectory, { recursive: true });
  await Promise.all([refreshSbiRates(), ...symbols.map(refreshStockCsv)]);
  console.log(
    "Market data refresh complete. Review the CSV changes before committing.",
  );
}

async function refreshSbiRates(): Promise<void> {
  const response = await fetch(sbiSource);
  if (!response.ok) {
    throw new Error(
      `Could not download SBI reference rates (${response.status})`,
    );
  }
  const csv = await response.text();
  if (!/^\uFEFF?(?:Date|DATE),.*\bTT BUY\b/m.test(csv)) {
    throw new Error(
      "Downloaded SBI reference-rate file does not have the expected header",
    );
  }
  // The upstream data uses `DATE`; the browser lookup uses the canonical `Date` column.
  const normalizedCsv = csv.replace(/^\uFEFF?DATE,/, "Date,");
  await writeFile("public/SBI_REFERENCE_RATES_USD.csv", normalizedCsv);
  console.log("Updated SBI_REFERENCE_RATES_USD.csv");
}

async function refreshStockCsv(symbol: string): Promise<void> {
  const period1 = Math.floor(Date.UTC(2020, 0, 1) / 1000);
  const period2 = Math.floor(Date.now() / 1000);
  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
  );
  url.searchParams.set("period1", String(period1));
  url.searchParams.set("period2", String(period2));
  url.searchParams.set("interval", "1d");
  url.searchParams.set("events", "history");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Could not download ${symbol} prices from Yahoo Finance (${response.status})`,
    );
  }
  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart.result?.[0];
  if (!result) {
    throw new Error(
      `Yahoo Finance returned no ${symbol} data: ${payload.chart.error?.description ?? "unknown error"}`,
    );
  }

  const quote = result.indicators.quote[0];
  const rows = result.timestamp.flatMap((timestamp, index) => {
    const close = quote.close[index];
    const high = quote.high[index];
    const low = quote.low[index];
    const open = quote.open[index];
    const volume = quote.volume[index];
    if ([close, high, low, open, volume].some((value) => value === null))
      return [];
    const date = new Date(timestamp * 1000);
    const formattedDate = `${String(date.getUTCMonth() + 1).padStart(2, "0")}/${String(date.getUTCDate()).padStart(2, "0")}/${date.getUTCFullYear()}`;
    return [`${formattedDate},$${close},${volume},$${open},$${high},$${low}`];
  });

  if (!rows.length)
    throw new Error(`Yahoo Finance returned no usable ${symbol} prices`);
  rows.reverse();
  await writeFile(
    `${stockDirectory}/${symbol}.csv`,
    ["Date,Close/Last,Volume,Open,High,Low", ...rows].join("\n").concat("\n"),
  );
  console.log(`Updated ${symbol}.csv (${rows.length} trading days)`);
}

await refresh();
