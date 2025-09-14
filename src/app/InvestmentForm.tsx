// components/InvestmentForm.tsx
"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectItem,
    SelectContent,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

const equityOptions = [
    "AAPL",
    "AMZN",
    "MSFT",
    "GOOGL",
    "META",
    "NFLX",
    "Other",
];

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
                            <Label className="w-1/3">Equity:</Label>
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
                            <Label className="w-1/3">Units:</Label>
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
                            <Label className="w-1/3">Date of Investment:</Label>
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
                            <Label className="w-1/3">Fair Market Value (USD, optional):</Label>
                            <Input
                                className="max-w-1/3"
                                type="number"
                                step="any"
                                {...register(`investments.${index}.fairMarketValueUSD`, {
                                    valueAsNumber: true,
                                })}
                            />
                        </div>

                        {/* Is Old Asset */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={watchInvestments?.[index]?.isOldAsset || false}
                                onCheckedChange={(checked) =>
                                    setValue(`investments.${index}.isOldAsset`, checked)
                                }
                            />
                            <Label className="w-1/3">Is Old Asset?</Label>
                            <input
                                type="hidden"
                                {...register(`investments.${index}.isOldAsset`)}
                            />
                        </div>

                        {/* Upload CSV – only for 'Other' */}
                        {
                            equity === "Other" && (
                                <div>
                                    <Label className="w-1/3">Upload Stock Price CSV for Custom Equity:</Label>
                                    <Input
                                        type="file"
                                        accept=".csv"
                                        {...register(`investments.${index}.customCSV`)}
                                    />
                                </div>
                            )
                        }
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
                        isOldAsset: false,
                    })
                }
            >
                + Add Investment
            </Button>
        </div >
    );
};
