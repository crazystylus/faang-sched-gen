// components/DownloadCSVButton.tsx
"use client";

import {
  generateScheduleFACSV,
  type InvestmentResult,
} from "@/lib/scheduleFAExport";

interface DownloadCSVButtonProps {
  data: InvestmentResult[];
}

export const DownloadCSVButton: React.FC<DownloadCSVButtonProps> = ({
  data,
}) => {
  const handleDownload = () => {
    const missingInitialValues = data.filter(
      (item) => item.initialValueINR === undefined,
    );
    if (missingInitialValues.length) {
      const investments = missingInitialValues
        .map((item) => `${item.equity} (${item.dateOfInvestment})`)
        .join(", ");
      const shouldContinue = window.confirm(
        `The initial value is blank for ${investments} because historic price or SBI TT Buy data is unavailable. Find and enter the initial value manually before filing. Download the CSV anyway?`,
      );
      if (!shouldContinue) return;
    }
    const csvContent = generateScheduleFACSV(data);
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Schedule_FA_A3.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
      Download Schedule FA A3 CSV
    </button>
  );
};
