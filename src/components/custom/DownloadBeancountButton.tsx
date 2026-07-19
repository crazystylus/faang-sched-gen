"use client";

import { generateBeancount } from "@/lib/beancountExport";
import type { InvestmentResult } from "@/lib/scheduleFAExport";

interface DownloadBeancountButtonProps {
  data: InvestmentResult[];
}

export function DownloadBeancountButton({
  data,
}: DownloadBeancountButtonProps) {
  const handleDownload = () => {
    const content = generateBeancount(data);
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "rsu-vesting.beancount";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
    >
      Download Beancount
    </button>
  );
}
