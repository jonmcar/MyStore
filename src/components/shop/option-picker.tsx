"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import type {
  ListingOption,
  ListingOptionChoice,
  SelectListingOption,
  MultiSelectListingOption,
  TextListingOption,
  TextareaListingOption,
  NumberListingOption,
  FileListingOption,
  DatetimeListingOption,
} from "@/lib/types";

/**
 * Raw value storage for each option type:
 *  - select → chosen choice id (string)
 *  - multi-select → array of chosen choice ids (string[])
 *  - text / textarea / number / datetime → user input (string)
 *  - file → null or a { name, sizeBytes } descriptor (not the File)
 */
export type OptionRawValue =
  | string
  | string[]
  | { name: string; sizeBytes: number }
  | null
  | undefined;

export type OptionValues = Record<string, OptionRawValue>;

interface OptionPickerProps {
  options: ListingOption[];
  value: OptionValues;
  onChange: (next: OptionValues) => void;
  /** Which option ids should be flagged as missing/invalid */
  missing?: string[];
}

export function OptionPicker({
  options,
  value,
  onChange,
  missing = [],
}: OptionPickerProps) {
  if (options.length === 0) return null;

  const setOne = (id: string, v: OptionRawValue) =>
    onChange({ ...value, [id]: v });

  return (
    <div className="space-y-5">
      {options.map((option) => (
        <OptionField
          key={option.id}
          option={option}
          value={value[option.id]}
          onChange={(v) => setOne(option.id, v)}
          isMissing={missing.includes(option.id)}
        />
      ))}
    </div>
  );
}

// ─── Per-option dispatcher ──────────────────────────────────────────

interface FieldProps<T extends ListingOption, V> {
  option: T;
  value: V;
  onChange: (v: V) => void;
  isMissing: boolean;
}

function OptionField({
  option,
  value,
  onChange,
  isMissing,
}: {
  option: ListingOption;
  value: OptionRawValue;
  onChange: (v: OptionRawValue) => void;
  isMissing: boolean;
}) {
  switch (option.type) {
    case "select":
      return (
        <SelectField
          option={option}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          isMissing={isMissing}
        />
      );
    case "multi-select":
      return (
        <MultiSelectField
          option={option}
          value={Array.isArray(value) ? value : []}
          onChange={onChange}
          isMissing={isMissing}
        />
      );
    case "text":
      return (
        <TextField
          option={option}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          isMissing={isMissing}
        />
      );
    case "textarea":
      return (
        <TextareaField
          option={option}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          isMissing={isMissing}
        />
      );
    case "number":
      return (
        <NumberField
          option={option}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          isMissing={isMissing}
        />
      );
    case "file":
      return (
        <FileField
          option={option}
          value={
            value && typeof value === "object" && "name" in value
              ? (value as { name: string; sizeBytes: number })
              : null
          }
          onChange={onChange}
          isMissing={isMissing}
        />
      );
    case "datetime":
      return (
        <DatetimeField
          option={option}
          value={typeof value === "string" ? value : ""}
          onChange={onChange}
          isMissing={isMissing}
        />
      );
  }
}

// ─── Shared helper blocks ───────────────────────────────────────────

function FieldLabel({
  id,
  option,
}: {
  id: string;
  option: ListingOption;
}) {
  return (
    <Label htmlFor={id} className="text-sm font-medium">
      {option.name}
      {option.required && (
        <span className="text-muted-foreground ml-1 font-normal">
          (required)
        </span>
      )}
    </Label>
  );
}

function FieldHelp({ option }: { option: ListingOption }) {
  if (!option.helpText) return null;
  return <p className="text-muted-foreground text-xs">{option.helpText}</p>;
}

function FieldError({
  isMissing,
  message,
}: {
  isMissing: boolean;
  message: string;
}) {
  if (!isMissing) return null;
  return <p className="text-destructive text-xs">{message}</p>;
}

/** Render a choice label with optional "(+$X.XX)" / "(-$X.XX)" suffix */
function choiceLabel(c: ListingOptionChoice): string {
  if (!c.priceModifierCents) return c.label;
  const sign = c.priceModifierCents > 0 ? "+" : "−";
  return `${c.label} (${sign}${formatMoney(Math.abs(c.priceModifierCents))})`;
}

// ─── Select (dropdown or radio) ─────────────────────────────────────

function SelectField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<SelectListingOption, string>) {
  const id = `option-${option.id}`;
  const invalidClass = isMissing
    ? "border-destructive ring-destructive ring-1"
    : undefined;

  if (option.display === "radio") {
    return (
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">
          {option.name}
          {option.required && (
            <span className="text-muted-foreground ml-1 font-normal">
              (required)
            </span>
          )}
        </legend>
        <FieldHelp option={option} />
        <RadioGroup
          value={value}
          onValueChange={onChange}
          className="grid gap-2 sm:grid-cols-2"
        >
          {option.choices.map((c) => {
            const outOfStock = c.stockCount === 0;
            const choiceId = `${id}-${c.id}`;
            return (
              <Label
                key={c.id}
                htmlFor={choiceId}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm",
                  value === c.id && !outOfStock
                    ? "border-foreground"
                    : "hover:bg-accent",
                  outOfStock && "pointer-events-none opacity-50",
                  isMissing && "border-destructive"
                )}
              >
                <RadioGroupItem
                  value={c.id}
                  id={choiceId}
                  disabled={outOfStock}
                />
                <span className="flex-1">{choiceLabel(c)}</span>
                {outOfStock && (
                  <span className="text-muted-foreground text-xs">
                    Sold out
                  </span>
                )}
              </Label>
            );
          })}
        </RadioGroup>
        <FieldError
          isMissing={isMissing}
          message={`Please choose ${option.name.toLowerCase()}.`}
        />
      </fieldset>
    );
  }

  // dropdown
  return (
    <div className="space-y-1.5">
      <FieldLabel id={id} option={option} />
      <FieldHelp option={option} />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className={invalidClass}
          aria-invalid={isMissing}
        >
          <SelectValue placeholder={`Choose ${option.name.toLowerCase()}…`} />
        </SelectTrigger>
        <SelectContent>
          {option.choices.map((c) => {
            const outOfStock = c.stockCount === 0;
            return (
              <SelectItem key={c.id} value={c.id} disabled={outOfStock}>
                {choiceLabel(c)}
                {outOfStock ? " — sold out" : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <FieldError
        isMissing={isMissing}
        message={`Please choose ${option.name.toLowerCase()}.`}
      />
    </div>
  );
}

// ─── Multi-select (checkbox group) ──────────────────────────────────

function MultiSelectField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<MultiSelectListingOption, string[]>) {
  const id = `option-${option.id}`;

  const toggle = (choiceId: string) => {
    if (value.includes(choiceId)) {
      onChange(value.filter((v) => v !== choiceId));
    } else {
      if (option.maxSelections && value.length >= option.maxSelections) return;
      onChange([...value, choiceId]);
    }
  };

  const bounds = [
    typeof option.minSelections === "number"
      ? `choose at least ${option.minSelections}`
      : null,
    typeof option.maxSelections === "number"
      ? `up to ${option.maxSelections}`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium">
        {option.name}
        {option.required && (
          <span className="text-muted-foreground ml-1 font-normal">
            (required)
          </span>
        )}
      </legend>
      <FieldHelp option={option} />
      {bounds && (
        <p className="text-muted-foreground text-xs capitalize">{bounds}</p>
      )}
      <div className="space-y-2">
        {option.choices.map((c) => {
          const choiceId = `${id}-${c.id}`;
          const checked = value.includes(c.id);
          const outOfStock = c.stockCount === 0;
          const atMax =
            !checked &&
            typeof option.maxSelections === "number" &&
            value.length >= option.maxSelections;
          const disabled = outOfStock || atMax;
          return (
            <Label
              key={c.id}
              htmlFor={choiceId}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm",
                checked ? "border-foreground bg-accent/50" : "hover:bg-accent",
                disabled && "pointer-events-none opacity-50",
                isMissing && "border-destructive"
              )}
            >
              <Checkbox
                id={choiceId}
                checked={checked}
                onCheckedChange={() => toggle(c.id)}
                disabled={disabled}
              />
              <span className="flex-1">{choiceLabel(c)}</span>
              {outOfStock && (
                <span className="text-muted-foreground text-xs">Sold out</span>
              )}
            </Label>
          );
        })}
      </div>
      <FieldError
        isMissing={isMissing}
        message={`Please make a valid selection for ${option.name.toLowerCase()}.`}
      />
    </fieldset>
  );
}

// ─── Text ───────────────────────────────────────────────────────────

function TextField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<TextListingOption, string>) {
  const id = `option-${option.id}`;
  const invalidClass = isMissing
    ? "border-destructive ring-destructive ring-1"
    : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel id={id} option={option} />
      <FieldHelp option={option} />
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={option.placeholder}
        maxLength={option.maxLength}
        className={invalidClass}
        aria-invalid={isMissing}
      />
      {option.maxLength && (
        <p className="text-muted-foreground text-right text-xs">
          {value.length}/{option.maxLength}
        </p>
      )}
      <FieldError
        isMissing={isMissing}
        message={`Please fill in ${option.name.toLowerCase()}.`}
      />
    </div>
  );
}

// ─── Textarea ───────────────────────────────────────────────────────

function TextareaField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<TextareaListingOption, string>) {
  const id = `option-${option.id}`;
  const invalidClass = isMissing
    ? "border-destructive ring-destructive ring-1"
    : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel id={id} option={option} />
      <FieldHelp option={option} />
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={option.placeholder}
        maxLength={option.maxLength}
        rows={4}
        className={invalidClass}
        aria-invalid={isMissing}
      />
      {option.maxLength && (
        <p className="text-muted-foreground text-right text-xs">
          {value.length}/{option.maxLength}
        </p>
      )}
      <FieldError
        isMissing={isMissing}
        message={`Please fill in ${option.name.toLowerCase()}.`}
      />
    </div>
  );
}

// ─── Number ─────────────────────────────────────────────────────────

function NumberField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<NumberListingOption, string>) {
  const id = `option-${option.id}`;
  const invalidClass = isMissing
    ? "border-destructive ring-destructive ring-1"
    : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel id={id} option={option} />
      <FieldHelp option={option} />
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={option.placeholder}
        min={option.min}
        max={option.max}
        step={option.step}
        className={invalidClass}
        aria-invalid={isMissing}
      />
      <FieldError
        isMissing={isMissing}
        message={`Please enter a valid ${option.name.toLowerCase()}.`}
      />
    </div>
  );
}

// ─── File ───────────────────────────────────────────────────────────

function FileField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<FileListingOption, { name: string; sizeBytes: number } | null>) {
  const id = `option-${option.id}`;
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSizeError(null);
    const file = e.target.files?.[0];
    if (!file) {
      onChange(null);
      return;
    }
    if (option.maxSizeMB && file.size > option.maxSizeMB * 1024 * 1024) {
      setSizeError(
        `File is larger than ${option.maxSizeMB} MB. Please choose a smaller one.`
      );
      onChange(null);
      // Reset the input so the same file can be retried after shrinking
      e.target.value = "";
      return;
    }
    onChange({ name: file.name, sizeBytes: file.size });
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel id={id} option={option} />
      <FieldHelp option={option} />
      <Input
        id={id}
        type="file"
        accept={option.accept}
        onChange={handleFile}
        className={cn(
          "file:text-foreground file:cursor-pointer",
          isMissing && "border-destructive"
        )}
        aria-invalid={isMissing}
      />
      {value && (
        <p className="text-muted-foreground flex items-center gap-2 text-xs">
          <Check className="h-3 w-3" />
          Attached: {value.name} ({formatBytes(value.sizeBytes)})
        </p>
      )}
      {option.maxSizeMB && !value && !sizeError && (
        <p className="text-muted-foreground text-xs">
          Max {option.maxSizeMB} MB.
        </p>
      )}
      {sizeError && <p className="text-destructive text-xs">{sizeError}</p>}
      <FieldError
        isMissing={isMissing}
        message={`Please attach a file for ${option.name.toLowerCase()}.`}
      />
      <p className="text-muted-foreground text-[10px] italic">
        (Mock mode — the file isn&apos;t actually uploaded yet. Only the
        file name is recorded.)
      </p>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Datetime ───────────────────────────────────────────────────────

function DatetimeField({
  option,
  value,
  onChange,
  isMissing,
}: FieldProps<DatetimeListingOption, string>) {
  const id = `option-${option.id}`;
  const isDate = (option.mode ?? "date") === "date";
  const invalidClass = isMissing
    ? "border-destructive ring-destructive ring-1"
    : undefined;
  return (
    <div className="space-y-1.5">
      <FieldLabel id={id} option={option} />
      <FieldHelp option={option} />
      <Input
        id={id}
        type={isDate ? "date" : "datetime-local"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={option.min}
        max={option.max}
        className={invalidClass}
        aria-invalid={isMissing}
      />
      <FieldError
        isMissing={isMissing}
        message={`Please pick a ${isDate ? "date" : "date and time"}.`}
      />
    </div>
  );
}
