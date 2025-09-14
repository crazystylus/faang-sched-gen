// pages/form.tsx
"use client";

import { useForm, FormProvider } from "react-hook-form";
import { useRouter } from "next/router";
import { InvestmentForm } from "./InvestmentForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const assessmentYears = [
  "2021-2022",
  "2022-2023",
  "2023-2024",
  "2024-2025",
  "2025-2026",
];

export default function FormPage() {
  const methods = useForm({
    defaultValues: {
      assessmentYear: "",
      investments: [],
    },
  });

  const router = useRouter();

  const onSubmit = (data: any) => {
    console.log("Submitted Data:", data);
    // Store in localStorage or pass via router for /result page
    localStorage.setItem("fa-input", JSON.stringify(data));
    router.push("/result");
  };

  const { setValue, register } = methods;

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="max-w-4xl mx-auto p-6 space-y-8"
      >
        <h1 className="text-2xl font-bold">Schedule FA Generator</h1>

        {/* Assessment Year */}
        <div>
          <Label>Assessment Year</Label>
          <Select onValueChange={(value) => setValue("assessmentYear", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {assessmentYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" {...register("assessmentYear")} />
        </div>

        {/* Investment Form */}
        <InvestmentForm />

        <Button type="submit" className="mt-4">
          Compute Schedule FA
        </Button>
      </form>
    </FormProvider>
  );
}
