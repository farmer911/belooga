"use client";

import React, { useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

// The <html class="dark"> flag is the source of truth; observe it instead of mirroring it into state.
function subscribeToThemeClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  // null on the server and during hydration, so the placeholder renders until mounted.
  const isDark = useSyncExternalStore(
    subscribeToThemeClass,
    () => document.documentElement.classList.contains("dark"),
    () => null
  );

  const toggleTheme = () => {
    const nextDark = !isDark;
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("belooga-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("belooga-theme", "light");
    }
  };

  if (isDark === null) {
    return (
      <div
        className="w-9 h-9 rounded-lg border border-surface-border bg-surface-card opacity-50"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
      title={isDark ? "Chế độ Sáng" : "Chế độ Tối"}
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-surface-border bg-surface-card hover:bg-surface-page text-typography-heading hover:text-brand-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary cursor-pointer shadow-xs"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-status-warning" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-typography-heading" aria-hidden="true" />
      )}
    </button>
  );
}
