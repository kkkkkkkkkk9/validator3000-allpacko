"use client";

import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <button
      onClick={cycleTheme}
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        zIndex: 9999,
        background: "none",
        border: "1px solid #333",
        color: "#888",
        fontFamily: "inherit",
        fontSize: 11,
        padding: "6px 12px",
        cursor: "pointer",
        textTransform: "capitalize",
        letterSpacing: 1,
      }}
    >
      Theme: {theme}
    </button>
  );
}
