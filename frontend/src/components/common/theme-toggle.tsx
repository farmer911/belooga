"use client";

import React, { useEffect, useState } from "react";

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
        className="w-8 h-8 rounded-lg border border-surface-border bg-surface-card opacity-50"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
      title={isDark ? "Chế độ Sáng" : "Chế độ Tối"}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-surface-border bg-surface-card hover:bg-surface-page text-typography-heading hover:text-brand-primary transition-colors cursor-pointer shadow-xs"
    >
      {isDark ? (
        <span className="text-sm select-none" role="img" aria-label="Sun">
          ☀️
        </span>
      ) : (
        <span className="text-sm select-none" role="img" aria-label="Moon">
          🌙
        </span>
      )}
    </button>
  );
}
