"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  Cookie,
  Info,
  Bell,
  Sparkles,
  Lock,
  Heart,
  Megaphone,
  TriangleAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { StorePopup, PopupIcon } from "@/lib/types";

/**
 * First-visit popup.
 *
 * Appears once per browser tab session. The user's choice is stored
 * in sessionStorage, so:
 *   - Soft refresh (F5)         → popup stays dismissed
 *   - Navigating around         → popup stays dismissed
 *   - Hard refresh (Ctrl-F5)    → popup stays dismissed (session persists)
 *   - New tab (same site)       → popup reappears (new session)
 *   - Closing and reopening tab → popup reappears (new session)
 *
 * Accept → closes the popup, remembers dismissal for this session.
 * Decline → redirects to google.com (placeholder behavior).
 *
 * The popup is controlled via the storefront admin — enabled, title,
 * subtitle, body, icon, and button labels are all editable.
 */

const STORAGE_KEY = "store-popup-dismissed";

/** Icon map — keep in sync with `PopupIcon` type in types.ts. */
const ICONS: Record<PopupIcon, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  cookie: Cookie,
  info: Info,
  bell: Bell,
  sparkles: Sparkles,
  lock: Lock,
  heart: Heart,
  megaphone: Megaphone,
  warning: TriangleAlert,
};

export function FirstVisitPopup({ popup }: { popup: StorePopup }) {
  // Start closed; open in useEffect after we've checked storage. This
  // avoids a hydration mismatch (server doesn't know what's in the
  // client's sessionStorage).
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!popup.enabled) return;
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setOpen(true);
      }
    } catch {
      // sessionStorage unavailable — show the popup and don't persist.
      setOpen(true);
    }
  }, [popup.enabled]);

  const handleAccept = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      // harmless
    }
    setOpen(false);
  };

  const handleDecline = () => {
    // Placeholder "declined" behavior — redirect away. Replace with
    // real logic later (e.g. disable analytics, route to a
    // limited-functionality version of the site, etc.).
    window.location.href = "https://www.google.com";
  };

  if (!popup.enabled) return null;

  const Icon = ICONS[popup.icon] ?? Shield;

  return (
    <Dialog
      open={open}
      // Prevent closing via Escape or overlay click — the user must
      // pick Accept or Decline explicitly (typical for compliance
      // dialogs).
      onOpenChange={() => {}}
    >
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="bg-primary/10 text-primary mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full">
            <Icon className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{popup.title}</DialogTitle>
          {popup.subtitle && (
            <DialogDescription className="text-center">
              {popup.subtitle}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Body text — wrapped so long content scrolls rather than
         * pushing the dialog off-screen. max-h keeps it sane on
         * small viewports; whitespace-pre-line preserves line breaks
         * the admin typed. */}
        <div className="text-muted-foreground max-h-[50vh] overflow-y-auto text-sm whitespace-pre-line">
          {popup.body}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleDecline}>
            {popup.declineLabel}
          </Button>
          <Button onClick={handleAccept}>{popup.acceptLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
