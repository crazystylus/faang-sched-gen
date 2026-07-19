// lib/scheduleFAExport.ts
import { format } from "date-fns";

export interface InvestmentResult {
  equity: string;
  units: number;
  dateOfInvestment: string; // ISO string
  initialValueUSD?: number;
  initialValueINR?: number;
  peakValueINR: number;
  closingValueINR: number;
  dateOfPeak: string;
  dateOfClosing: string;
}

const equityMetadata: Record<
  string,
  { entityName: string; address: string; zip: string }
> = {
  AMZN: {
    entityName: "Amazon.com Inc",
    address: "410 Terry Avenue N Seattle 8109 WA",
    zip: "98109",
  },
  AAPL: {
    entityName: "Apple Inc",
    address: "One Apple Park Way Cupertino CA 95014",
    zip: "95014",
  },
  GOOGL: {
    entityName: "Alphabet Inc",
    address: "1600 Amphitheatre Parkway Mountain View CA 94043",
    zip: "94043",
  },
  META: {
    entityName: "Meta Platforms Inc",
    address: "1 Meta Way Menlo Park CA 94025",
    zip: "94025",
  },
  NFLX: {
    entityName: "Netflix Inc",
    address: "121 Albright Way Los Gatos CA 95032",
    zip: "95032",
  },
  MSFT: {
    entityName: "Microsoft Corp",
    address: "One Microsoft Way Redmond WA 98052",
    zip: "98052",
  },
};

export function sortInvestmentResultsByDate(
  data: InvestmentResult[],
): InvestmentResult[] {
  return [...data].sort(
    (a, b) =>
      new Date(b.dateOfInvestment).getTime() -
      new Date(a.dateOfInvestment).getTime(),
  );
}

export function generateScheduleFACSV(data: InvestmentResult[]): string {
  const headers = [
    "Country/Region name",
    "Country Name and Code",
    "Name of entity",
    "Address of entity",
    "ZIP Code",
    "Nature of entity",
    "Date of acquiring the interest",
    "Initial value of the investment",
    "Peak value of investment during the Period",
    "Closing balance",
    "Total gross amount paid/credited with respect to the holding during the period",
    "Total gross proceeds from sale or redemption of investment during the period",
  ];

  const rows = sortInvestmentResultsByDate(data).map((item) => {
    const meta = equityMetadata[item.equity] ?? {
      entityName: `${item.equity} (Custom)`,
      address: "Unknown",
      zip: "",
    };

    return [
      "UNITED STATES OF AMERICA",
      "2", // Country Name and Code – "2" for United States
      meta.entityName,
      meta.address,
      meta.zip,
      "Company",
      format(new Date(item.dateOfInvestment), "yyyy-MM-dd"),
      item.initialValueINR?.toFixed(2) ?? "",
      item.peakValueINR.toFixed(2),
      item.closingValueINR.toFixed(2),
      "", // Total gross amount paid/credited
      "", // Total gross proceeds
    ];
  });

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  return csv;
}
