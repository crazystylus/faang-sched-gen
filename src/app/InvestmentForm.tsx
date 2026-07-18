// components/InvestmentForm.tsx
"use client";

import { format } from "date-fns";
import { CalendarIcon, Info } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const equityOptions = [
  "AAPL",
  "AMZN",
  "MSFT",
  "GOOGL",
  "META",
  "NFLX",
  "Other",
];

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

export const InvestmentForm = () => {
  const { register, control, watch, setValue, getFieldState, getValues } =
    useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "investments",
  });

  const watchInvestments = watch("investments");

  return (
    <div className="space-y-6">
      {fields.map((field, index) => {
        const equity = watchInvestments?.[index]?.equity || "";
        return (
          <div key={field.id} className="border p-4 rounded-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Investment #{index + 1}</h3>
              <Button variant="destructive" onClick={() => remove(index)}>
                Remove
              </Button>
            </div>

            {/* Equity Selector */}
            <div className="flex flex-row gap-4 w-full">
              <Label className="w-1/3 flex items-center gap-1">
                Equity
                <FieldHelp text="Select the company whose shares you hold. Choose Other to upload your own price-history CSV." />
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue(`investments.${index}.equity`, value)
                }
                defaultValue={watchInvestments?.[index]?.equity || ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equity" />
                </SelectTrigger>
                <SelectContent>
                  {equityOptions.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {eq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                type="hidden"
                {...register(`investments.${index}.equity`)}
              />
            </div>

            {/* Units */}
            <div className="flex flex-row gap-4 max-w-8xl">
              <Label className="w-1/3 flex items-center gap-1">
                Units
                <FieldHelp text="Enter the shares still held after any sell-to-cover transaction for taxes." />
              </Label>
              <Input
                className="max-w-1/3"
                type="number"
                step="any"
                {...register(`investments.${index}.units`, {
                  valueAsNumber: true,
                })}
              />
            </div>

            {/* Date of Investment */}
            <div className="flex flex-row gap-4">
              <Label className="w-1/3 flex items-center gap-1">
                Date of Investment
                <FieldHelp text="For RSUs, this is usually the vest date. The initial value is based on this date." />
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    data-empty={
                      !getFieldState(`investments.${index}.dateOfInvestment`)
                    }
                    className="data-[empty=true]:text-muted-foreground w-fit max-w-1/2 justify-start text-left font-normal"
                  >
                    <CalendarIcon />
                    {getValues(`investments.${index}.dateOfInvestment`) ? (
                      format(
                        getValues(`investments.${index}.dateOfInvestment`),
                        "PPP",
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    disabled={{ dayOfWeek: [0, 6] }}
                    captionLayout="dropdown"
                    fromYear={2020}
                    toYear={new Date().getFullYear()}
                    reverseYears
                    mode="single"
                    selected={getValues(
                      `investments.${index}.dateOfInvestment`,
                    )}
                    onSelect={(date) =>
                      setValue(`investments.${index}.dateOfInvestment`, date)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fair Market Value */}
            <div className="flex flex-row gap-4">
              <Label className="w-1/3 flex items-center gap-1">
                Fair Market Value (USD, optional)
                <FieldHelp text="Enter the per-share vest-date value from your employer or broker if you have it. Otherwise the app uses the available closing price." />
              </Label>
              <Input
                className="max-w-1/3"
                type="number"
                step="any"
                {...register(`investments.${index}.fairMarketValueUSD`, {
                  valueAsNumber: true,
                })}
              />
            </div>

            {/* Upload CSV – only for 'Other' */}
            {equity === "Other" && (
              <div>
                <Label className="w-1/3 flex items-center gap-1">
                  Upload Stock Price CSV for Custom Equity
                  <FieldHelp text="The CSV needs Date, Close/Last, and High columns. It is processed only in your browser." />
                </Label>
                <Input
                  type="file"
                  accept=".csv"
                  {...register(`investments.${index}.customCSV`)}
                />
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        onClick={() =>
          append({
            equity: "",
            units: 0,
            dateOfInvestment: "",
            fairMarketValueUSD: undefined,
          })
        }
      >
        + Add Investment
      </Button>
    </div>
  );
};
