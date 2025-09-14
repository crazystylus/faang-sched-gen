// pages/result.tsx
"use client";

import { useEffect, useState } from "react";
import { computeScheduleFA } from "@/lib/computeFA";
import { InvestmentResult } from "@/lib/scheduleFAExport";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { DownloadCSVButton } from "@/components/custom/DownloadCSVButton";
import { CommonNavMenu } from "@/components/custom/CommonNavBar";

export default function ResultPage() {
  const [results, setResults] = useState<InvestmentResult[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const inputRaw = localStorage.getItem("fa-input");
    if (!inputRaw) return;

    const input = JSON.parse(inputRaw);

    computeScheduleFA(input).then((res) => {
      setResults(res);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="p-4">⏳ Calculating...</p>;
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
              {results.map((r, idx) => (
                <TableRow key={idx} className="border-t">
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
          <CardFooter>
            <DownloadCSVButton data={results} />
          </CardFooter>
        </CardContent>
      </Card>
    </>
  );
}
