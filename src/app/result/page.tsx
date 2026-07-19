// pages/result.tsx
"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { CommonNavMenu } from "@/components/custom/CommonNavBar";
import { DownloadBeancountButton } from "@/components/custom/DownloadBeancountButton";
import { DownloadCSVButton } from "@/components/custom/DownloadCSVButton";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { computeScheduleFA } from "@/lib/computeFA";
import {
  type InvestmentResult,
  sortInvestmentResultsByDate,
} from "@/lib/scheduleFAExport";

export default function ResultPage() {
  const [results, setResults] = useState<InvestmentResult[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const inputRaw = localStorage.getItem("fa-input");
    if (!inputRaw) {
      setError(
        "No calculation input was found. Return home and enter your investments.",
      );
      setLoading(false);
      return;
    }

    try {
      const input = JSON.parse(inputRaw);
      computeScheduleFA(input)
        .then(setResults)
        .catch((reason: unknown) =>
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to calculate Schedule FA values.",
          ),
        )
        .finally(() => setLoading(false));
    } catch {
      setError(
        "Saved calculation input is invalid. Return home and enter it again.",
      );
      setLoading(false);
    }
  }, []);

  if (loading) return <p className="p-4">⏳ Calculating...</p>;
  if (error) return <p className="p-4 text-red-500">❌ {error}</p>;
  if (!results)
    return <p className="p-4 text-red-500">❌ No data to display.</p>;

  return (
    <>
      <CommonNavMenu />
      <Card className="max-w-6xl mx-auto my-8">
        <CardTitle className="text-3xl p-4">Schedule FA Results</CardTitle>
        <CardContent>
          <Table>
            {/* <TableCaption className="text-2xl font-bold mb-6">Schedule FA Computation</TableCaption> */}
            <TableHeader>
              <TableRow>
                <TableHead>Equity</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Initial</TableHead>
                <TableHead>Date of Investment</TableHead>
                <TableHead>Peak</TableHead>
                <TableHead>Date of Peak</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Date of Closing</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortInvestmentResultsByDate(results).map((r, idx) => (
                <TableRow
                  key={`${r.equity}-${r.dateOfInvestment}-${idx}`}
                  className="border-t"
                >
                  <TableCell>{r.equity}</TableCell>
                  <TableCell>{r.units}</TableCell>
                  <TableCell>
                    {typeof r.initialValueINR === "number"
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "INR",
                        }).format(Number(r.initialValueINR.toFixed(2)))
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {format(r.dateOfInvestment, "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    {typeof r.peakValueINR === "number"
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "INR",
                        }).format(Number(r.peakValueINR.toFixed(2)))
                      : "-"}
                  </TableCell>
                  <TableCell>{format(r.dateOfPeak, "yyyy-MM-dd")}</TableCell>
                  <TableCell>
                    {typeof r.closingValueINR === "number"
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "INR",
                        }).format(Number(r.closingValueINR.toFixed(2)))
                      : "-"}
                  </TableCell>
                  <TableCell>{format(r.dateOfClosing, "yyyy-MM-dd")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <CardFooter className="justify-between">
            <DownloadCSVButton data={results} />
            <DownloadBeancountButton data={results} />
          </CardFooter>
        </CardContent>
      </Card>
    </>
  );
}
