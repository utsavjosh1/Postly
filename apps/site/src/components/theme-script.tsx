'use client';

import { useEffect } from 'react';

export function ThemeScript({ storageKey = 'postly-theme' }: { storageKey?: string }) {
  useEffect(() => {
    // This runs after hydration to ensure theme is applied
    const applyTheme = () => {
      try {
        const theme = localStorage.getItem(storageKey);
        const isDark = theme === 'dark';
        
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(isDark ? 'dark' : 'light');
      } catch {
        // Fallback to light theme
        document.documentElement.classList.add('light');
      }
    };

    applyTheme();
  }, [storageKey]);

  return null;
}
