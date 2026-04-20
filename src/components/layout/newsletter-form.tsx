"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    toast.success("Thanks!", {
      description: "We'll email you when new pieces land.",
    });
    setEmail("");
  };

  return (
    <form className="flex max-w-sm gap-2 pt-2" onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="you@example.com"
        aria-label="Email address"
        className="bg-background"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit">Subscribe</Button>
    </form>
  );
}
