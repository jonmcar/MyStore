"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { Sparkles, Sun, Moon, VenusIcon, MarsIcon, Gem, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Theme system for MyStore.
 *
 * Three themes — default, dark, playful. The active theme is
 * represented by a class on <html> ("theme-default" / "theme-dark" /
 * "theme-playful"). Choice is persisted to localStorage so it sticks
 * across reloads. If no choice has ever been made, we default to
 * "playful" on first visit.
 *
 * The inline script in layout.tsx (NO_FLASH_SCRIPT) sets the class on
 * <html> synchronously, BEFORE any React hydration. This prevents the
 * "flash of wrong theme" that would otherwise appear for a split
 * second on every page load.
 */

export type ThemeName = "default" | "dark" | "confetti";

const THEMES: ThemeName[] = ["default", "dark", "confetti"];
const STORAGE_KEY = "store-theme";
const DEFAULT_THEME: ThemeName = "dark";

// ─── Context ────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}

// ─── Provider ───────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initial state: read from localStorage (the source of truth). SSR
  // can't access localStorage so it gets DEFAULT_THEME; the layout
  // effect below corrects the class on <html> before the browser
  // paints, so there's no visible flash (barring Turbopack's CSS
  // processing quirks).
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return DEFAULT_THEME;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (THEMES as readonly string[]).includes(saved)) {
        return saved as ThemeName;
      }
    } catch {
      // localStorage unavailable (private browsing) — fall through.
    }
    return DEFAULT_THEME;
  });

  // Apply the theme class to <html> synchronously on mount, before
  // the browser paints. useLayoutEffect (vs useEffect) is what gets
  // us the pre-paint timing.
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const t of THEMES) root.classList.remove(`theme-${t}`);
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = useCallback((next: ThemeName) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // harmless
    }
    setThemeState(next);
    // The layout effect above will sync the <html> class when state
    // changes, so we don't duplicate that work here.
  }, []);

  // Keep state in sync if another tab changes the theme.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      if (THEMES.includes(e.newValue as ThemeName)) {
        setTheme(e.newValue as ThemeName);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Switcher UI ────────────────────────────────────────────────────

const THEME_META: Record<
  ThemeName,
  { label: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  default: { label: "Default", Icon: Sun },
  dark: { label: "Dark", Icon: Moon },
  confetti: { label: "Confetti", Icon: PartyPopper},
};

/**
 * Three-button segmented toggle. Highlights the active theme. Clicking
 * a button switches to that theme immediately.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <div
      className={cn(
        "bg-muted text-muted-foreground grid grid-cols-3 gap-1 rounded-md p-1",
        className
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {THEMES.map((name) => {
        const { label, Icon } = THEME_META[name];
        const isActive = theme === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(name)}
            className={cn(
              "inline-flex flex-col items-center justify-center gap-0.5 rounded-sm px-2 py-1.5 text-[11px] font-medium transition-colors",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "hover:text-foreground"
            )}
            title={`Switch to ${label} theme`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
