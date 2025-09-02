"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-border/25 bg-background/60 hover:bg-secondary/50 hover:border-border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 backdrop-blur-sm flex items-center justify-center shadow-sm group"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center transition-all duration-300 ease-out group-hover:scale-110">
        {theme === "dark" ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </div>
    </button>
  );
}
