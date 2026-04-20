"use client";

import { Plus, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
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

interface OptionsEditorProps {
  value: ListingOption[];
  onChange: (next: ListingOption[]) => void;
}

const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function makeOption(type: ListingOption["type"]): ListingOption {
  const base = {
    id: newId("opt"),
    name: "",
    required: false,
  };
  switch (type) {
    case "select":
      return {
        ...base,
        type: "select",
        choices: [{ id: newId("c"), label: "" }],
        display: "dropdown",
      };
    case "multi-select":
      return {
        ...base,
        type: "multi-select",
        choices: [{ id: newId("c"), label: "" }],
      };
    case "text":
      return { ...base, type: "text" };
    case "textarea":
      return { ...base, type: "textarea" };
    case "number":
      return { ...base, type: "number" };
    case "file":
      return { ...base, type: "file" };
    case "datetime":
      return { ...base, type: "datetime", mode: "date" };
  }
}

export function OptionsEditor({ value, onChange }: OptionsEditorProps) {
  const updateAt = (i: number, next: ListingOption) =>
    onChange(value.map((opt, idx) => (idx === i ? next : opt)));
  const removeAt = (i: number) =>
    onChange(value.filter((_, idx) => idx !== i));
  const addOption = () => onChange([...value, makeOption("select")]);

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-4 py-6 text-center text-sm">
          <p>No customization options yet.</p>
          <p className="mt-1 text-xs">
            Shoppers won&apos;t see any dropdowns, write-ins, or other
            inputs on this listing.
          </p>
        </div>
      ) : (
        value.map((option, i) => (
          <OptionCard
            key={option.id}
            option={option}
            index={i}
            onChange={(next) => updateAt(i, next)}
            onRemove={() => removeAt(i)}
          />
        ))
      )}

      <Button type="button" variant="outline" onClick={addOption}>
        <Plus className="mr-2 h-4 w-4" />
        Add option
      </Button>
    </div>
  );
}

// ─── Individual option card ──────────────────────────────────────────

interface OptionCardProps {
  option: ListingOption;
  index: number;
  onChange: (next: ListingOption) => void;
  onRemove: () => void;
}

function OptionCard({ option, index, onChange, onRemove }: OptionCardProps) {
  const onTypeChange = (t: ListingOption["type"]) => {
    if (t === option.type) return;
    // Preserve shared fields when switching types; reset type-specific.
    const shared = {
      id: option.id,
      name: option.name,
      required: option.required,
      helpText: option.helpText,
    };
    onChange(
      t === "select" || t === "multi-select"
        ? {
            ...shared,
            type: t,
            choices:
              (option.type === "select" || option.type === "multi-select") &&
              option.choices.length > 0
                ? option.choices
                : [{ id: newId("c"), label: "" }],
            ...(t === "select" ? { display: "dropdown" as const } : {}),
          }
        : t === "text"
          ? { ...shared, type: "text" }
          : t === "textarea"
            ? { ...shared, type: "textarea" }
            : t === "number"
              ? { ...shared, type: "number" }
              : t === "file"
                ? { ...shared, type: "file" }
                : { ...shared, type: "datetime", mode: "date" }
    );
  };

  return (
    <div className="bg-background space-y-4 rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <div className="text-muted-foreground pt-2 text-xs font-medium tabular-nums">
          #{index + 1}
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-[160px_1fr_auto_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor={`${option.id}-type`} className="text-xs">
              Input type
            </Label>
            <Select
              value={option.type}
              onValueChange={(v) =>
                onTypeChange(v as ListingOption["type"])
              }
            >
              <SelectTrigger id={`${option.id}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="select">Dropdown</SelectItem>
                <SelectItem value="multi-select">Multi-select</SelectItem>
                <SelectItem value="text">Short text</SelectItem>
                <SelectItem value="textarea">Long text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="file">File upload</SelectItem>
                <SelectItem value="datetime">Date / time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${option.id}-name`} className="text-xs">
              Option name
            </Label>
            <Input
              id={`${option.id}-name`}
              value={option.name}
              onChange={(e) =>
                onChange({ ...option, name: e.target.value })
              }
              placeholder="e.g. Ring gauge, Engraving text"
            />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <Switch
              id={`${option.id}-required`}
              checked={option.required}
              onCheckedChange={(c) => onChange({ ...option, required: c })}
            />
            <Label
              htmlFor={`${option.id}-required`}
              className="cursor-pointer text-xs"
            >
              Required
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive mb-1"
            aria-label="Remove option"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`${option.id}-help`} className="text-xs">
          Help text{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={`${option.id}-help`}
          value={option.helpText ?? ""}
          onChange={(e) =>
            onChange({
              ...option,
              helpText: e.target.value || undefined,
            })
          }
          placeholder="Shown as a subtitle below the label"
        />
      </div>

      <Separator />

      {option.type === "select" && (
        <SelectConfig option={option} onChange={onChange} />
      )}
      {option.type === "multi-select" && (
        <MultiSelectConfig option={option} onChange={onChange} />
      )}
      {(option.type === "text" || option.type === "textarea") && (
        <TextConfig option={option} onChange={onChange} />
      )}
      {option.type === "number" && (
        <NumberConfig option={option} onChange={onChange} />
      )}
      {option.type === "file" && (
        <FileConfig option={option} onChange={onChange} />
      )}
      {option.type === "datetime" && (
        <DatetimeConfig option={option} onChange={onChange} />
      )}
    </div>
  );
}

// ─── Choice editor (shared by select and multi-select) ──────────────

interface ChoiceRowsProps {
  choices: ListingOptionChoice[];
  onChange: (choices: ListingOptionChoice[]) => void;
}

function ChoiceRows({ choices, onChange }: ChoiceRowsProps) {
  const updateChoice = (i: number, c: ListingOptionChoice) =>
    onChange(choices.map((x, idx) => (idx === i ? c : x)));
  const removeChoice = (i: number) =>
    onChange(choices.filter((_, idx) => idx !== i));
  const addChoice = () =>
    onChange([...choices, { id: newId("c"), label: "" }]);

  return (
    <div className="space-y-2">
      <div className="text-muted-foreground grid grid-cols-[1fr_120px_100px_40px] gap-2 text-xs">
        <span>Label</span>
        <span>Price change (¢)</span>
        <span>Stock</span>
        <span></span>
      </div>
      <ul className="space-y-2">
        {choices.map((choice, i) => (
          <li
            key={choice.id}
            className="grid grid-cols-[1fr_120px_100px_40px] items-center gap-2"
          >
            <Input
              value={choice.label}
              onChange={(e) =>
                updateChoice(i, { ...choice, label: e.target.value })
              }
              placeholder={`Choice ${i + 1}`}
            />
            <Input
              type="number"
              step="1"
              value={
                typeof choice.priceModifierCents === "number"
                  ? choice.priceModifierCents
                  : ""
              }
              onChange={(e) =>
                updateChoice(i, {
                  ...choice,
                  priceModifierCents: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="0"
              className="tabular-nums"
            />
            <Input
              type="number"
              min="0"
              value={
                typeof choice.stockCount === "number" ? choice.stockCount : ""
              }
              onChange={(e) =>
                updateChoice(i, {
                  ...choice,
                  stockCount: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                })
              }
              placeholder="∞"
              className="tabular-nums"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeChoice(i)}
              disabled={choices.length <= 1}
              className="text-muted-foreground hover:text-destructive h-9 w-9"
              aria-label={`Remove choice ${i + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-xs">
        Price change is in cents (e.g. 1500 = +$15.00). Leave stock empty
        for unlimited; set to 0 to mark a choice sold out.
      </p>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addChoice}
        className="w-full"
      >
        <Plus className="mr-2 h-3.5 w-3.5" />
        Add choice
      </Button>
    </div>
  );
}

// ─── Type-specific config panels ────────────────────────────────────

function SelectConfig({
  option,
  onChange,
}: {
  option: SelectListingOption;
  onChange: (next: SelectListingOption) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Display as</Label>
        <RadioGroup
          value={option.display ?? "dropdown"}
          onValueChange={(v) =>
            onChange({ ...option, display: v as "dropdown" | "radio" })
          }
          className="grid grid-cols-2 gap-2 sm:max-w-sm"
        >
          {[
            { v: "dropdown", label: "Dropdown", hint: "Compact" },
            { v: "radio", label: "Radio buttons", hint: "2–4 choices" },
          ].map((opt) => (
            <Label
              key={opt.v}
              className="hover:bg-accent flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm"
            >
              <RadioGroupItem value={opt.v} />
              <div>
                <div>{opt.label}</div>
                <div className="text-muted-foreground text-xs">{opt.hint}</div>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>
      <ChoiceRows
        choices={option.choices}
        onChange={(choices) => onChange({ ...option, choices })}
      />
    </div>
  );
}

function MultiSelectConfig({
  option,
  onChange,
}: {
  option: MultiSelectListingOption;
  onChange: (next: MultiSelectListingOption) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="space-y-1.5">
          <Label htmlFor={`${option.id}-min`} className="text-xs">
            Min selections{" "}
            <span className="text-muted-foreground font-normal">(opt.)</span>
          </Label>
          <Input
            id={`${option.id}-min`}
            type="number"
            min="0"
            value={
              typeof option.minSelections === "number"
                ? option.minSelections
                : ""
            }
            onChange={(e) =>
              onChange({
                ...option,
                minSelections: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${option.id}-max`} className="text-xs">
            Max selections{" "}
            <span className="text-muted-foreground font-normal">(opt.)</span>
          </Label>
          <Input
            id={`${option.id}-max`}
            type="number"
            min="1"
            value={
              typeof option.maxSelections === "number"
                ? option.maxSelections
                : ""
            }
            onChange={(e) =>
              onChange({
                ...option,
                maxSelections: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </div>
      </div>
      <ChoiceRows
        choices={option.choices}
        onChange={(choices) => onChange({ ...option, choices })}
      />
    </div>
  );
}

function TextConfig({
  option,
  onChange,
}: {
  option: TextListingOption | TextareaListingOption;
  onChange: (next: TextListingOption | TextareaListingOption) => void;
}) {
  const isTextarea = option.type === "textarea";
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${option.id}-placeholder`} className="text-xs">
          Placeholder{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        {isTextarea ? (
          <Textarea
            id={`${option.id}-placeholder`}
            value={option.placeholder ?? ""}
            onChange={(e) =>
              onChange({
                ...option,
                placeholder: e.target.value || undefined,
              })
            }
            rows={2}
          />
        ) : (
          <Input
            id={`${option.id}-placeholder`}
            value={option.placeholder ?? ""}
            onChange={(e) =>
              onChange({
                ...option,
                placeholder: e.target.value || undefined,
              })
            }
          />
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${option.id}-maxlen`} className="text-xs">
          Max length{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={`${option.id}-maxlen`}
          type="number"
          min="1"
          value={typeof option.maxLength === "number" ? option.maxLength : ""}
          onChange={(e) =>
            onChange({
              ...option,
              maxLength: e.target.value ? Number(e.target.value) : undefined,
            })
          }
        />
      </div>
    </div>
  );
}

function NumberConfig({
  option,
  onChange,
}: {
  option: NumberListingOption;
  onChange: (next: NumberListingOption) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="space-y-1.5">
        <Label htmlFor={`${option.id}-placeholder`} className="text-xs">
          Placeholder
        </Label>
        <Input
          id={`${option.id}-placeholder`}
          value={option.placeholder ?? ""}
          onChange={(e) =>
            onChange({
              ...option,
              placeholder: e.target.value || undefined,
            })
          }
        />
      </div>
      {(["min", "max", "step"] as const).map((key) => (
        <div key={key} className="space-y-1.5">
          <Label
            htmlFor={`${option.id}-${key}`}
            className="text-xs capitalize"
          >
            {key}{" "}
            <span className="text-muted-foreground font-normal">(opt.)</span>
          </Label>
          <Input
            id={`${option.id}-${key}`}
            type="number"
            step={key === "step" ? "any" : undefined}
            value={typeof option[key] === "number" ? option[key] : ""}
            onChange={(e) =>
              onChange({
                ...option,
                [key]: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
      ))}
    </div>
  );
}

function FileConfig({
  option,
  onChange,
}: {
  option: FileListingOption;
  onChange: (next: FileListingOption) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${option.id}-accept`} className="text-xs">
          Accepted file types{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={`${option.id}-accept`}
          value={option.accept ?? ""}
          onChange={(e) =>
            onChange({ ...option, accept: e.target.value || undefined })
          }
          placeholder='e.g. "image/*" or ".pdf,.png"'
          className="font-mono text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${option.id}-maxsize`} className="text-xs">
          Max size (MB){" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id={`${option.id}-maxsize`}
          type="number"
          min="1"
          value={typeof option.maxSizeMB === "number" ? option.maxSizeMB : ""}
          onChange={(e) =>
            onChange({
              ...option,
              maxSizeMB: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="5"
        />
      </div>
      <p className="text-muted-foreground col-span-2 text-xs italic">
        Heads up: in mock mode the uploaded file isn&apos;t actually stored
        — only the file name is captured on the cart line. Real uploads
        land with the file-storage work.
      </p>
    </div>
  );
}

function DatetimeConfig({
  option,
  onChange,
}: {
  option: DatetimeListingOption;
  onChange: (next: DatetimeListingOption) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Mode</Label>
        <RadioGroup
          value={option.mode ?? "date"}
          onValueChange={(v) =>
            onChange({ ...option, mode: v as "date" | "datetime" })
          }
          className="grid grid-cols-2 gap-2 sm:max-w-sm"
        >
          {[
            { v: "date", label: "Date only" },
            { v: "datetime", label: "Date + time" },
          ].map((opt) => (
            <Label
              key={opt.v}
              className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
            >
              <RadioGroupItem value={opt.v} />
              <span>{opt.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${option.id}-min`} className="text-xs">
            Earliest{" "}
            <span className="text-muted-foreground font-normal">(opt.)</span>
          </Label>
          <Input
            id={`${option.id}-min`}
            type={option.mode === "datetime" ? "datetime-local" : "date"}
            value={option.min ?? ""}
            onChange={(e) =>
              onChange({ ...option, min: e.target.value || undefined })
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${option.id}-max`} className="text-xs">
            Latest{" "}
            <span className="text-muted-foreground font-normal">(opt.)</span>
          </Label>
          <Input
            id={`${option.id}-max`}
            type={option.mode === "datetime" ? "datetime-local" : "date"}
            value={option.max ?? ""}
            onChange={(e) =>
              onChange({ ...option, max: e.target.value || undefined })
            }
          />
        </div>
      </div>
    </div>
  );
}
