"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Link as LinkIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImageAction } from "@/lib/uploads";
import { cn } from "@/lib/utils";

/**
 * ImagePicker lets the admin either paste an image URL or upload a
 * file. In both cases, the outcome is the same: `onChange` is called
 * with a string URL, and the parent stores that URL wherever it
 * stores image references. The parent doesn't know or care which
 * mode was used.
 *
 * Currently uploaded files land in `public/uploads/` via the
 * `uploadImageAction` server action. When the app someday moves to
 * cloud storage, only that server action changes — this component
 * and its callers stay the same.
 */
interface ImagePickerProps {
  value: string;
  onChange: (url: string) => void;
  /** Optional label text shown above the picker. */
  label?: string;
  /** Optional help text shown below. */
  helpText?: string;
  /** Optional id — used to prefix internal field ids for ADA. */
  id?: string;
  /** Show a preview of the current value. Default true. */
  showPreview?: boolean;
  /** Show a Clear button next to the preview when set. Default true. */
  allowClear?: boolean;
}

export function ImagePicker({
  value,
  onChange,
  label,
  helpText,
  id = "image-picker",
  showPreview = true,
  allowClear = true,
}: ImagePickerProps) {
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [draftUrl, setDraftUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUrlSet = () => {
    const url = draftUrl.trim();
    if (!url) return;
    onChange(url);
    setDraftUrl("");
    toast.success("Image set");
  };

  const handleFileSelect = (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const res = await uploadImageAction(formData);
      if (res.ok) {
        onChange(res.url);
        toast.success("Image uploaded");
        // Reset the file input so the same file can be picked again
        // if the admin wants to retry.
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        toast.error("Upload failed", { description: res.error });
      }
    });
  };

  const clear = () => onChange("");

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-muted-foreground text-xs font-medium">{label}</p>
      )}

      {/* Preview + clear */}
      {showPreview && (
        <div className="bg-muted relative flex aspect-[3/2] items-center justify-center overflow-hidden rounded-md border">
          {value ? (
            <>
              <Image
                src={value}
                alt=""
                fill
                sizes="400px"
                className="object-cover"
                unoptimized
              />
              {allowClear && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={clear}
                  className="absolute top-2 right-2 h-7 gap-1 px-2 text-xs shadow"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-xs">No image set</p>
          )}
        </div>
      )}

      {/* Mode toggle */}
      <div className="bg-muted text-muted-foreground grid grid-cols-2 gap-1 rounded-md p-1">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "link"
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground"
          )}
          aria-pressed={mode === "link"}
        >
          <LinkIcon className="h-3 w-3" />
          Link
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "upload"
              ? "bg-background text-foreground shadow-sm"
              : "hover:text-foreground"
          )}
          aria-pressed={mode === "upload"}
        >
          <Upload className="h-3 w-3" />
          Upload
        </button>
      </div>

      {mode === "link" && (
        <div className="flex gap-2">
          <Input
            id={`${id}-url`}
            type="url"
            placeholder="https://…"
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlSet();
              }
            }}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            onClick={handleUrlSet}
            disabled={!draftUrl.trim() || pending}
          >
            Set
          </Button>
        </div>
      )}

      {mode === "upload" && (
        <label
          htmlFor={`${id}-file`}
          className={cn(
            "hover:bg-accent/50 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-6 text-center transition-colors",
            pending && "pointer-events-none opacity-50"
          )}
        >
          {pending ? (
            <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
          ) : (
            <Upload className="text-muted-foreground h-5 w-5" />
          )}
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {pending ? "Uploading…" : "Click to choose a file"}
            </p>
            <p className="text-muted-foreground text-xs">
              JPEG, PNG, WebP, or GIF · up to 5 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            id={`${id}-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={pending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="sr-only"
          />
        </label>
      )}

      {helpText && (
        <p className="text-muted-foreground text-xs">{helpText}</p>
      )}
    </div>
  );
}
