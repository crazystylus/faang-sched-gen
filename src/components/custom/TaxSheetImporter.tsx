"use client";

/**
 * TaxSheetImporter.tsx
 *
 * Renders a list of "tax sheet slots". Each slot lets the user:
 *   1. Pick an adapter (employer tax-sheet type) from a dropdown.
 *   2. Upload the corresponding file.
 *   3. See import status / errors.
 *   4. Remove the slot if no longer needed.
 *
 * New adapters are automatically surfaced here once they are added to
 * src/lib/taxSheetRegistry.ts – no UI code changes required.
 */

import { FileSpreadsheet, Info, Plug, PlusCircle, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TAX_SHEET_ADAPTERS,
  getAdapterById,
} from "@/lib/taxSheetRegistry";
import type { InvestmentInput } from "@/lib/computeFA";

// ── Types ──────────────────────────────────────────────────────────────────

type SlotStatus = "idle" | "loading" | "success" | "error";

interface SheetSlot {
  /** Unique key for React list rendering */
  key: string;
  adapterId: string | null;
  status: SlotStatus;
  message: string | null;
}

interface TaxSheetImporterProps {
  /** Called for each successfully parsed batch of investments */
  onImport: (investments: InvestmentInput[]) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function makeSlot(): SheetSlot {
  return { key: uid(), adapterId: null, status: "idle", message: null };
}

// ── Component ──────────────────────────────────────────────────────────────

export function TaxSheetImporter({ onImport }: TaxSheetImporterProps) {
  const [slots, setSlots] = useState<SheetSlot[]>([makeSlot()]);

  const updateSlot = (key: string, patch: Partial<SheetSlot>) =>
    setSlots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );

  const addSlot = () => setSlots((prev) => [...prev, makeSlot()]);

  const removeSlot = (key: string) =>
    setSlots((prev) => prev.filter((s) => s.key !== key));

  const handleAdapterChange = (key: string, adapterId: string) => {
    updateSlot(key, { adapterId, status: "idle", message: null });
  };

  const handleFileChange = async (
    slotKey: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const slot = slots.find((s) => s.key === slotKey);
    if (!slot?.adapterId) return;

    const adapter = getAdapterById(slot.adapterId);
    if (!adapter) return;

    updateSlot(slotKey, {
      status: "loading",
      message: `Reading ${adapter.label}…`,
    });

    try {
      const investments = await adapter.importFile(file);
      if (!investments.length) {
        updateSlot(slotKey, {
          status: "error",
          message: "No qualifying rows were found in this file.",
        });
        return;
      }
      onImport(investments);
      updateSlot(slotKey, {
        status: "success",
        message: `✓ Imported ${investments.length} vesting${investments.length === 1 ? "" : "s"} from ${adapter.label}.`,
      });
    } catch (err) {
      updateSlot(slotKey, {
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : `Failed to read the file: ${String(err)}`,
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4 shrink-0" />
              Import Tax Sheets
            </CardTitle>
            <CardDescription>
              Select your employer's tax-sheet format, then upload the exported
              file. Each imported vesting will appear as an editable investment
              below.
            </CardDescription>
          </div>
          <AdapterCountBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {slots.map((slot) => (
          <SheetSlotRow
            key={slot.key}
            slot={slot}
            onAdapterChange={(id) => handleAdapterChange(slot.key, id)}
            onFileChange={(e) => handleFileChange(slot.key, e)}
            onRemove={slots.length > 1 ? () => removeSlot(slot.key) : undefined}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={addSlot}
        >
          <PlusCircle className="size-4" />
          Add another sheet
        </Button>

        {/* Extensibility hint for developers */}
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70 pt-1">
          <Plug className="size-3 shrink-0" />
          More employer tax-sheet formats can be added via{" "}
          <code className="font-mono">src/lib/taxSheetRegistry.ts</code>.
        </p>
      </CardContent>
    </Card>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

/** Shows how many adapters are registered. */
function AdapterCountBadge() {
  return (
    <Badge variant="secondary" className="shrink-0 text-xs gap-1">
      {TAX_SHEET_ADAPTERS.length} adapter{TAX_SHEET_ADAPTERS.length === 1 ? "" : "s"}
    </Badge>
  );
}

interface SheetSlotRowProps {
  slot: SheetSlot;
  onAdapterChange: (adapterId: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
}

function SheetSlotRow({
  slot,
  onAdapterChange,
  onFileChange,
  onRemove,
}: SheetSlotRowProps) {
  const selectId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adapter = slot.adapterId ? getAdapterById(slot.adapterId) : undefined;

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
      {/* Row header: adapter selector + remove button */}
      <div className="flex items-center gap-2">
        <Label htmlFor={selectId} className="sr-only">
          Tax sheet type
        </Label>

        <Select onValueChange={onAdapterChange} value={slot.adapterId ?? ""}>
          <SelectTrigger id={selectId} className="flex-1 bg-background">
            <SelectValue placeholder="Select sheet type…" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 text-xs">
                Available adapters
              </SelectLabel>
              {TAX_SHEET_ADAPTERS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectGroup>

            {/* Placeholder row – purely informational */}
            <SelectGroup>
              <SelectLabel className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Plug className="size-3" />
                Coming soon / add your own
              </SelectLabel>
              <SelectItem value="__placeholder__" disabled>
                More adapters via taxSheetRegistry.ts
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={onRemove}
            aria-label="Remove this sheet slot"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* File upload – shown once an adapter is selected */}
      {adapter && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm">
              Upload file{" "}
              <span className="text-muted-foreground font-normal">
                ({adapter.accept})
              </span>
            </Label>
            <AdapterHelpIcon adapter={adapter} />
          </div>
          <Input
            ref={fileInputRef}
            type="file"
            accept={adapter.accept}
            onChange={onFileChange}
            disabled={slot.status === "loading"}
            className="bg-background cursor-pointer"
          />
        </div>
      )}

      {/* Status message */}
      {slot.message && (
        <p
          className={`text-sm ${slot.status === "error"
            ? "text-destructive"
            : slot.status === "success"
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
            }`}
        >
          {slot.message}
        </p>
      )}
    </div>
  );
}

function AdapterHelpIcon({ adapter }: { adapter: { label: string; accept: string } }) {
  const helpText = `Upload a ${adapter.label} export. Accepted formats: ${adapter.accept}. The file is processed entirely in your browser and never uploaded to any server.`;
  return (
    <button
      type="button"
      className="inline-flex text-muted-foreground"
      title={helpText}
      aria-label={helpText}
    >
      <Info className="size-3.5" aria-hidden="true" />
    </button>
  );
}
