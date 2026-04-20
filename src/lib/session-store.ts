"use client";

/**
 * Mock session store.
 *
 * This stands in for a real auth system so the rest of the app can already
 * key UI and routing off of `role`. Swap this out for NextAuth.js, Clerk,
 * or your own auth endpoints later — the surface is intentionally small:
 *   const session = useSession((s) => s.session);
 *   session.role === "admin"
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Session, UserRole } from "./types";

const GUEST_SESSION: Session = {
  userId: null,
  name: null,
  email: null,
  role: "guest",
};

interface SessionState {
  session: Session;
  hasHydrated: boolean;
  signIn: (email: string, role?: UserRole) => void;
  signOut: () => void;
  /** Dev helper: flip an existing session's role without logging out */
  setRole: (role: UserRole) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      session: GUEST_SESSION,
      hasHydrated: false,

      signIn: (email, role = "shopper") => {
        const name = email.split("@")[0].replace(/[._-]/g, " ");
        set({
          session: {
            userId: `user_${Date.now()}`,
            name: name.replace(/\b\w/g, (c) => c.toUpperCase()),
            email,
            role,
          },
        });
      },

      signOut: () => set({ session: GUEST_SESSION }),

      setRole: (role) => {
        const current = get().session;
        if (!current.userId) return;
        set({ session: { ...current, role } });
      },
    }),
    {
      name: "store-session",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true;
      },
    }
  )
);
