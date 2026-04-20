"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { ImagePicker } from "./image-picker";
import type {
  HeroData,
  FeaturedData,
  EditorialData,
  CategoriesData,
  PromoData,
  ServicesData,
  TextBlockData,
  ImageBannerData,
  StoreAnnouncement,
  StorePopup,
  PopupIcon,
} from "@/lib/types";

// ─── Hero ───────────────────────────────────────────────────────────

export function HeroEditor({
  value,
  onChange,
}: {
  value: HeroData;
  onChange: (next: HeroData) => void;
}) {
  const set = <K extends keyof HeroData>(key: K, v: HeroData[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field
        id="hero-eyebrow"
        label="Eyebrow (small text above headline)"
        value={value.eyebrow}
        onChange={(v) => set("eyebrow", v)}
      />
      <Field
        id="hero-headline"
        label="Headline"
        value={value.headline}
        onChange={(v) => set("headline", v)}
      />
      <TextareaField
        id="hero-subtitle"
        label="Subtitle"
        value={value.subtitle}
        onChange={(v) => set("subtitle", v)}
        rows={3}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="hero-primary-label"
          label="Primary button label"
          value={value.primaryCtaLabel}
          onChange={(v) => set("primaryCtaLabel", v)}
        />
        <Field
          id="hero-primary-href"
          label="Primary button link"
          value={value.primaryCtaHref}
          onChange={(v) => set("primaryCtaHref", v)}
          mono
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="hero-secondary-label"
          label="Secondary button label"
          value={value.secondaryCtaLabel}
          onChange={(v) => set("secondaryCtaLabel", v)}
        />
        <Field
          id="hero-secondary-href"
          label="Secondary button link"
          value={value.secondaryCtaHref}
          onChange={(v) => set("secondaryCtaHref", v)}
          mono
        />
      </div>
      <ImagePicker
        id="hero-image"
        label="Hero image"
        value={value.imageUrl}
        onChange={(v) => set("imageUrl", v)}
      />
      <Field
        id="hero-alt"
        label="Hero image alt text"
        value={value.imageAlt}
        onChange={(v) => set("imageAlt", v)}
      />
    </div>
  );
}

// ─── Featured ───────────────────────────────────────────────────────

export function FeaturedEditor({
  value,
  onChange,
}: {
  value: FeaturedData;
  onChange: (next: FeaturedData) => void;
}) {
  const set = <K extends keyof FeaturedData>(
    key: K,
    v: FeaturedData[K]
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field
        id="feat-title"
        label="Section title"
        value={value.title}
        onChange={(v) => set("title", v)}
      />
      <Field
        id="feat-subtitle"
        label="Subtitle"
        value={value.subtitle}
        onChange={(v) => set("subtitle", v)}
      />
      <div className="space-y-1.5 sm:max-w-[140px]">
        <Label htmlFor="feat-limit" className="text-xs">
          Max items to show
        </Label>
        <Input
          id="feat-limit"
          type="number"
          min={1}
          max={12}
          value={value.limit}
          onChange={(e) => set("limit", Number(e.target.value) || 1)}
        />
      </div>
      <p className="bg-muted/40 text-muted-foreground rounded-md p-3 text-xs">
        Listings shown here are pulled automatically from items with{" "}
        <strong className="text-foreground">Featured</strong> set to on in
        the listing editor. Edit a listing to change which ones qualify.
      </p>
    </div>
  );
}

// ─── Editorial ──────────────────────────────────────────────────────

export function EditorialEditor({
  value,
  onChange,
}: {
  value: EditorialData;
  onChange: (next: EditorialData) => void;
}) {
  const set = <K extends keyof EditorialData>(
    key: K,
    v: EditorialData[K]
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field
        id="ed-eyebrow"
        label="Eyebrow"
        value={value.eyebrow}
        onChange={(v) => set("eyebrow", v)}
      />
      <Field
        id="ed-headline"
        label="Headline"
        value={value.headline}
        onChange={(v) => set("headline", v)}
      />
      <TextareaField
        id="ed-body"
        label="Body"
        value={value.body}
        onChange={(v) => set("body", v)}
        rows={5}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="ed-link-label"
          label="Link label (optional)"
          value={value.linkLabel ?? ""}
          onChange={(v) => set("linkLabel", v || undefined)}
        />
        <Field
          id="ed-link-href"
          label="Link URL (optional)"
          value={value.linkHref ?? ""}
          onChange={(v) => set("linkHref", v || undefined)}
          mono
        />
      </div>
    </div>
  );
}

// ─── Categories ─────────────────────────────────────────────────────

export function CategoriesEditor({
  value,
  onChange,
}: {
  value: CategoriesData;
  onChange: (next: CategoriesData) => void;
}) {
  return (
    <div className="space-y-4">
      <Field
        id="cat-title"
        label="Section title"
        value={value.title}
        onChange={(v) => onChange({ ...value, title: v })}
      />
      <p className="bg-muted/40 text-muted-foreground rounded-md p-3 text-xs">
        Categories are pulled automatically from every category in use
        across your listings. Add or edit listings to change this list.
      </p>
    </div>
  );
}

// ─── Promo ──────────────────────────────────────────────────────────

export function PromoEditor({
  value,
  onChange,
}: {
  value: PromoData;
  onChange: (next: PromoData) => void;
}) {
  const set = <K extends keyof PromoData>(key: K, v: PromoData[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field
        id="promo-eyebrow"
        label="Eyebrow"
        value={value.eyebrow}
        onChange={(v) => set("eyebrow", v)}
      />
      <Field
        id="promo-headline"
        label="Headline"
        value={value.headline}
        onChange={(v) => set("headline", v)}
      />
      <TextareaField
        id="promo-body"
        label="Body"
        value={value.body}
        onChange={(v) => set("body", v)}
        rows={3}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="promo-cta-label"
          label="Button label"
          value={value.ctaLabel}
          onChange={(v) => set("ctaLabel", v)}
        />
        <Field
          id="promo-cta-href"
          label="Button link"
          value={value.ctaHref}
          onChange={(v) => set("ctaHref", v)}
          mono
        />
      </div>
    </div>
  );
}

// ─── Services ───────────────────────────────────────────────────────

export function ServicesEditor({
  value,
  onChange,
}: {
  value: ServicesData;
  onChange: (next: ServicesData) => void;
}) {
  const set = <K extends keyof ServicesData>(
    key: K,
    v: ServicesData[K]
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field
        id="svc-eyebrow"
        label="Eyebrow"
        value={value.eyebrow}
        onChange={(v) => set("eyebrow", v)}
      />
      <Field
        id="svc-title"
        label="Section title"
        value={value.title}
        onChange={(v) => set("title", v)}
      />
      <TextareaField
        id="svc-subtitle"
        label="Subtitle"
        value={value.subtitle}
        onChange={(v) => set("subtitle", v)}
        rows={2}
      />
      <div className="space-y-1.5 sm:max-w-[140px]">
        <Label htmlFor="svc-limit" className="text-xs">
          Max items to show
        </Label>
        <Input
          id="svc-limit"
          type="number"
          min={1}
          max={12}
          value={value.limit}
          onChange={(e) => set("limit", Number(e.target.value) || 1)}
        />
      </div>
    </div>
  );
}

// ─── Text block (new) ───────────────────────────────────────────────

export function TextBlockEditor({
  value,
  onChange,
}: {
  value: TextBlockData;
  onChange: (next: TextBlockData) => void;
}) {
  const set = <K extends keyof TextBlockData>(
    key: K,
    v: TextBlockData[K]
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <Field
        id="tb-eyebrow"
        label="Eyebrow (optional)"
        value={value.eyebrow}
        onChange={(v) => set("eyebrow", v)}
      />
      <Field
        id="tb-headline"
        label="Headline (optional)"
        value={value.headline}
        onChange={(v) => set("headline", v)}
      />
      <TextareaField
        id="tb-body"
        label="Body"
        value={value.body}
        onChange={(v) => set("body", v)}
        rows={5}
      />
      <div className="space-y-2">
        <Label className="text-xs">Alignment</Label>
        <RadioGroup
          value={value.alignment}
          onValueChange={(v) => set("alignment", v as "left" | "center")}
          className="grid grid-cols-2 gap-2 sm:max-w-sm"
        >
          {[
            { v: "left", label: "Left" },
            { v: "center", label: "Center" },
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
      <p className="bg-muted/40 text-muted-foreground rounded-md p-3 text-xs">
        Line breaks in the body are preserved on the page.
      </p>
    </div>
  );
}

// ─── Image banner (new) ─────────────────────────────────────────────

export function ImageBannerEditor({
  value,
  onChange,
}: {
  value: ImageBannerData;
  onChange: (next: ImageBannerData) => void;
}) {
  const set = <K extends keyof ImageBannerData>(
    key: K,
    v: ImageBannerData[K]
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <ImagePicker
        id="ib-image"
        label="Banner image"
        value={value.imageUrl}
        onChange={(v) => set("imageUrl", v)}
      />
      <Field
        id="ib-alt"
        label="Image alt text"
        value={value.imageAlt}
        onChange={(v) => set("imageAlt", v)}
      />

      <div className="space-y-1.5 sm:max-w-xs">
        <Label htmlFor="ib-opacity" className="text-xs">
          Overlay darkness ({Math.round(value.overlayOpacity * 100)}%)
        </Label>
        <input
          id="ib-opacity"
          type="range"
          min={0}
          max={80}
          step={5}
          value={Math.round(value.overlayOpacity * 100)}
          onChange={(e) =>
            set("overlayOpacity", Number(e.target.value) / 100)
          }
          className="w-full"
        />
        <p className="text-muted-foreground text-xs">
          Darker overlay helps overlaid text stay readable against a
          busy image.
        </p>
      </div>

      <Field
        id="ib-eyebrow"
        label="Eyebrow (optional)"
        value={value.eyebrow}
        onChange={(v) => set("eyebrow", v)}
      />
      <Field
        id="ib-headline"
        label="Headline"
        value={value.headline}
        onChange={(v) => set("headline", v)}
      />
      <TextareaField
        id="ib-body"
        label="Body"
        value={value.body}
        onChange={(v) => set("body", v)}
        rows={2}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="ib-cta-label"
          label="Button label (optional)"
          value={value.ctaLabel}
          onChange={(v) => set("ctaLabel", v)}
        />
        <Field
          id="ib-cta-href"
          label="Button link (optional)"
          value={value.ctaHref}
          onChange={(v) => set("ctaHref", v)}
          mono
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Text placement</Label>
        <RadioGroup
          value={value.textPlacement}
          onValueChange={(v) =>
            set("textPlacement", v as ImageBannerData["textPlacement"])
          }
          className="grid grid-cols-3 gap-2 sm:max-w-sm"
        >
          {[
            { v: "left", label: "Left" },
            { v: "center", label: "Center" },
            { v: "right", label: "Right" },
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
    </div>
  );
}

// ─── Announcement banner ────────────────────────────────────────────

export function AnnouncementEditor({
  value,
  onChange,
}: {
  value: StoreAnnouncement;
  onChange: (next: StoreAnnouncement) => void;
}) {
  const set = <K extends keyof StoreAnnouncement>(
    key: K,
    v: StoreAnnouncement[K]
  ) => onChange({ ...value, [key]: v });
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-md border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="ann-enabled" className="text-sm font-medium">
            Show announcement banner
          </Label>
          <p className="text-muted-foreground text-xs">
            Appears as a thin bar above the header on every page.
          </p>
        </div>
        <Switch
          id="ann-enabled"
          checked={value.enabled}
          onCheckedChange={(c) => set("enabled", c)}
        />
      </div>

      <Field
        id="ann-message"
        label="Message"
        value={value.message}
        onChange={(v) => set("message", v)}
      />

      <div className="space-y-2">
        <Label className="text-xs">Tone</Label>
        <RadioGroup
          value={value.tone}
          onValueChange={(v) =>
            set("tone", v as StoreAnnouncement["tone"])
          }
          className="grid grid-cols-3 gap-2 sm:max-w-md"
        >
          {[
            { v: "info", label: "Info", hint: "Blue" },
            { v: "success", label: "Success", hint: "Green" },
            { v: "warning", label: "Warning", hint: "Amber" },
          ].map((opt) => (
            <Label
              key={opt.v}
              className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
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

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="ann-link-label"
          label="Link label (optional)"
          value={value.linkLabel ?? ""}
          onChange={(v) => set("linkLabel", v || undefined)}
        />
        <Field
          id="ann-link-href"
          label="Link URL (optional)"
          value={value.linkHref ?? ""}
          onChange={(v) => set("linkHref", v || undefined)}
          mono
        />
      </div>
    </div>
  );
}

// ─── Popup (first-visit modal) ─────────────────────────────────────

const POPUP_ICON_OPTIONS: { value: PopupIcon; label: string }[] = [
  { value: "shield", label: "Shield" },
  { value: "cookie", label: "Cookie" },
  { value: "info", label: "Info" },
  { value: "bell", label: "Bell" },
  { value: "sparkles", label: "Sparkles" },
  { value: "lock", label: "Lock" },
  { value: "heart", label: "Heart" },
  { value: "megaphone", label: "Megaphone" },
  { value: "warning", label: "Warning" },
];

export function PopupEditor({
  value,
  onChange,
}: {
  value: StorePopup;
  onChange: (next: StorePopup) => void;
}) {
  const set = <K extends keyof StorePopup>(key: K, v: StorePopup[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 rounded-md border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="popup-enabled" className="text-sm font-medium">
            Show first-visit popup
          </Label>
          <p className="text-muted-foreground text-xs">
            Appears as a modal dialog once per browser tab session.
            Dismissed with Accept or Decline.
          </p>
        </div>
        <Switch
          id="popup-enabled"
          checked={value.enabled}
          onCheckedChange={(c) => set("enabled", c)}
        />
      </div>

      <Field
        id="popup-title"
        label="Title"
        value={value.title}
        onChange={(v) => set("title", v)}
      />

      <Field
        id="popup-subtitle"
        label="Subtitle (optional)"
        value={value.subtitle ?? ""}
        onChange={(v) => set("subtitle", v || undefined)}
      />

      <TextareaField
        id="popup-body"
        label="Body"
        value={value.body}
        onChange={(v) => set("body", v)}
        rows={5}
      />

      <div className="space-y-2">
        <Label className="text-xs">Icon</Label>
        <RadioGroup
          value={value.icon}
          onValueChange={(v) => set("icon", v as PopupIcon)}
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          {POPUP_ICON_OPTIONS.map((opt) => (
            <Label
              key={opt.value}
              className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm"
            >
              <RadioGroupItem value={opt.value} />
              <span>{opt.label}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          id="popup-accept"
          label="Accept button label"
          value={value.acceptLabel}
          onChange={(v) => set("acceptLabel", v)}
        />
        <Field
          id="popup-decline"
          label="Decline button label"
          value={value.declineLabel}
          onChange={(v) => set("declineLabel", v)}
        />
      </div>
    </div>
  );
}

// ─── Small shared input fields ──────────────────────────────────────

function Field({
  id,
  label,
  value,
  onChange,
  mono,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={mono ? "font-mono text-sm" : undefined}
      />
    </div>
  );
}

function TextareaField({
  id,
  label,
  value,
  onChange,
  rows,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows ?? 3}
      />
    </div>
  );
}
