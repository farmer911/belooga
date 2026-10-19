"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasDark = document.documentElement.classList.contains("dark");
    setIsDark(hasDark);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("belooga-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("belooga-theme", "light");
    }
  };

  if (!mounted) {
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
        <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
      ) : (
        <Moon className="w-4 h-4 text-typography-heading" aria-hidden="true" />
      )}
    </button>
  );
}
