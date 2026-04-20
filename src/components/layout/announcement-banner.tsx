import Link from "next/link";
import { Info, Megaphone, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStorefrontContent } from "@/lib/data";

const TONE_STYLES = {
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900",
  success:
    "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-900",
  warning:
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900",
} as const;

const TONE_ICONS = {
  info: Info,
  success: Megaphone,
  warning: AlertTriangle,
} as const;

/** Server component — reads the announcement from the storefront
 * content and renders the banner (or nothing) accordingly. */
export async function AnnouncementBanner() {
  const { announcement } = await getStorefrontContent();
  if (!announcement.enabled || !announcement.message.trim()) return null;

  const Icon = TONE_ICONS[announcement.tone];
  const hasLink = !!(announcement.linkLabel && announcement.linkHref);

  return (
    <div className={cn("border-b", TONE_STYLES[announcement.tone])}>
      <div className="container mx-auto flex items-center justify-center gap-3 px-4 py-2 text-center text-sm sm:px-6 lg:px-8">
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="line-clamp-1">{announcement.message}</span>
        {hasLink && (
          <Link
            href={announcement.linkHref!}
            className="shrink-0 font-medium underline-offset-4 hover:underline"
          >
            {announcement.linkLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
