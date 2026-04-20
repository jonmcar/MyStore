"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/lib/session-store";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const session = useSessionStore((s) => s.session);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);

  // Block the flash of admin UI until we know who's here.
  if (!hasHydrated) {
    return (
      <div className="text-muted-foreground p-10 text-sm">Loading…</div>
    );
  }

  if (session.role !== "admin") {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md space-y-4 text-center">
          <div className="bg-muted mx-auto grid h-14 w-14 place-items-center rounded-full">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin access required
          </h1>
          <p className="text-muted-foreground text-sm">
            You need to be signed in as a store admin to view this page.
            Click the user icon in the header and sign in with role{" "}
            <span className="text-foreground font-medium">Store admin</span>.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Back to storefront</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
