"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const THEMES = ["cloud", "sky", "sage", "lavender", "sand", "rose", "dark"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "v3k_theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  cycleTheme: () => void;
  themes: readonly Theme[];
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyThemeToBody(theme: Theme) {
  // Remove all theme classes
  document.body.classList.remove("light", ...THEMES.map((t) => `theme-${t}`));
  if (theme === "dark") {
    // no classes needed -- dark is the default
  } else {
    document.body.classList.add("light");
    if (theme !== "cloud") {
      document.body.classList.add(`theme-${theme}`);
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("cloud");
  const [mounted, setMounted] = useState(false);

  // On mount, read persisted theme
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial = stored && THEMES.includes(stored) ? stored : "cloud";
    setThemeState(initial);
    applyThemeToBody(initial);
    setMounted(true);
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    applyThemeToBody(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const cycleTheme = useCallback(() => {
    setThemeState((current) => {
      const idx = THEMES.indexOf(current);
      const next = THEMES[(idx + 1) % THEMES.length];
      applyThemeToBody(next);
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  // Prevent flash of wrong theme on SSR
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
