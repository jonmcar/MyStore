"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AvailabilityStatus } from "@/lib/types";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  availability?: AvailabilityStatus;
}

const STAMP_STYLES: Record<
  Exclude<AvailabilityStatus, "available">,
  { classes: string; label: string }
> = {
  "sold-out": {
    classes: "text-red-800 dark:text-red-400",
    label: "Sold out",
  },
  unavailable: {
    classes: "text-amber-800 dark:text-amber-400",
    label: "Unavailable",
  },
};

export function ImageGallery({
  images,
  alt,
  availability = "available",
}: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const stamp =
    availability !== "available" ? STAMP_STYLES[availability] : null;

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
        <Image
          key={active}
          src={images[active]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className={cn("object-cover", stamp && "grayscale")}
        />
        {stamp && (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <span
              className={cn(
                "bg-background rounded-md px-5 py-2 text-base font-semibold tracking-[0.15em] uppercase shadow-lg",
                stamp.classes
              )}
            >
              {stamp.label}
            </span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="grid grid-cols-4 gap-2"
          role="tablist"
          aria-label="Product images"
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1} of ${images.length}`}
              onClick={() => setActive(i)}
              className={cn(
                "bg-muted relative aspect-square overflow-hidden rounded-md border-2 transition-colors",
                i === active
                  ? "border-foreground"
                  : "border-transparent hover:border-border"
              )}
            >
              <Image src={src} alt="" fill sizes="20vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
