"use client";

import { useState } from "react";
import Link from "next/link";
import { User, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useSessionStore } from "@/lib/session-store";
import { ThemeSwitcher } from "./theme";
import type { UserRole } from "@/lib/types";

export function UserMenu() {
  const session = useSessionStore((s) => s.session);
  const hasHydrated = useSessionStore((s) => s.hasHydrated);
  const signOut = useSessionStore((s) => s.signOut);

  // Prevent SSR mismatch: render a stable guest icon until hydration.
  if (!hasHydrated || !session.userId) {
    return <SignInDialog />;
  }

  const initial = session.name?.[0]?.toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Account menu"
        >
          <div className="bg-primary text-primary-foreground flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium">
            {initial}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {session.name}
            </p>
            <p className="text-muted-foreground truncate text-xs leading-none">
              {session.email}
            </p>
            <Badge
              variant="outline"
              className="mt-1 w-fit text-[10px] capitalize"
            >
              {session.role}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <User className="mr-2 h-4 w-4" /> My account
          </Link>
        </DropdownMenuItem>
        {session.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Settings className="mr-2 h-4 w-4" /> Admin
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-muted-foreground mb-1.5 text-[10px] font-medium uppercase tracking-wider">
            Theme
          </p>
          <ThemeSwitcher />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Mock sign-in dialog. No real auth — just lets us pick a role and set
 * a display name so the rest of the app can exercise role-gated UI.
 */
function SignInDialog() {
  const signIn = useSessionStore((s) => s.signIn);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("shopper");

  const handleSubmit = () => {
    if (!email.trim()) return;
    signIn(email.trim(), role);
    setOpen(false);
    setEmail("");
    setRole("shopper");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Sign in">
          <User className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>
            Demo mode — no password needed. Pick a role to test different
            parts of the app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sign in as</legend>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as UserRole)}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { v: "shopper", label: "Shopper" },
                { v: "admin", label: "Store admin" },
              ].map((opt) => (
                <Label
                  key={opt.v}
                  htmlFor={`role-${opt.v}`}
                  className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-3"
                >
                  <RadioGroupItem value={opt.v} id={`role-${opt.v}`} />
                  <span className="text-sm">{opt.label}</span>
                </Label>
              ))}
            </RadioGroup>
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!email.trim()}>
            Sign in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
