import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Theme } from '../types/wizard';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('aks-wizard-theme');
    return (saved as Theme) || 'theme-paleontology';
  });

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('aks-wizard-theme', t);
  };

  useEffect(() => {
    // Remove all theme classes and add the current one
    document.body.classList.remove(
      'theme-classic',
      'theme-win95',
      'theme-cyberpunk',
      'theme-nature',
      'theme-dark',
      'theme-high-contrast',
      'theme-fluent',
      'theme-paleontology',
    );
    document.body.classList.add(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
