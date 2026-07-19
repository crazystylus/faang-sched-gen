// pages/form.tsx
"use client";

import { Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { CommonNavMenu } from "@/components/custom/CommonNavBar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScheduleFAInput } from "@/lib/computeFA";
import { InvestmentForm } from "./InvestmentForm";

const currentYear = new Date().getFullYear();
const startYear = 2021;
const endYear = currentYear + 1; // include next FY
const assessmentYears: string[] = [];
for (let y = endYear; y >= startYear; y--) {
  assessmentYears.push(`${y}-${y + 1}`);
}

function FieldHelp({ text }: { text: string }) {
  return (
    <button
      type="button"
      className="inline-flex text-muted-foreground"
      title={text}
      aria-label={text}
    >
      <Info className="size-4" aria-hidden="true" />
    </button>
  );
}

const getYearLabel = (ay: string) => {
  const startAY = parseInt(ay.split("-")[0], 10);
  const fyStart = startAY - 1;
  const fyEnd = startAY % 100;
  const cy = fyStart;
  return `FY ${fyStart}-${fyEnd} (AY ${ay}) [CY ${cy}]`;
};

export default function FormPage() {
  const router = useRouter();
  const methods = useForm<ScheduleFAInput>({
    defaultValues: {
      assessmentYear: "",
      investments: [],
    },
  });

  const onSubmit = async (data: ScheduleFAInput) => {
    const serializableInput: ScheduleFAInput = {
      ...data,
      investments: await Promise.all(
        data.investments.map(async (investment) => {
          const file =
            typeof FileList !== "undefined" &&
            investment.customCSV instanceof FileList
              ? investment.customCSV.item(0)
              : investment.customCSV;
          return file instanceof File
            ? { ...investment, customCSV: await file.text() }
            : investment;
        }),
      ),
    };
    // Store in localStorage or pass via router for /result page
    localStorage.setItem("fa-input", JSON.stringify(serializableInput));
    router.push("/result");
  };

  const { setValue, register } = methods;

  return (
    <>
      <CommonNavMenu />
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="max-w-4xl mx-auto p-6 flex flex-col gap-4"
        >
          <h1 className="text-2xl font-bold">FA Ledger</h1>
          <p className="text-sm text-muted-foreground">
            Track foreign assets &amp; generate ITR-ready Schedule FA — calculates
            initial, peak, and closing values in INR using SBI TT Buy rates.
            Built-in stock-price and SBI TT Buy data start in 2020; initial
            values for earlier acquisitions may be left blank for manual review.
          </p>
          <div className="flex flex-row gap-5 items-center">
            <Label className="flex items-center gap-1">
              Select Financial Year
              <FieldHelp text="Schedule FA uses the calendar year shown in brackets. For example, AY 2025-26 uses calendar year 2024." />
            </Label>
            <Select
              onValueChange={(value) => setValue("assessmentYear", value)}
            >
              <SelectTrigger className="w-[380px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {assessmentYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {getYearLabel(year)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("assessmentYear")} />
          </div>
          <InvestmentForm />
          <Button type="submit" className="mt-4">
            Compute Schedule FA
          </Button>
        </form>
      </FormProvider>
    </>
  );
}

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
//               src/app/page.tsx
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }
