import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'floodguard-theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (saved && ['light', 'dark'].includes(saved)) {
        return saved;
      }
    }
    return 'light';
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(theme);

  const applyTheme = (currentTheme: Theme) => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const isDark = currentTheme === 'dark';

    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      setResolvedTheme('dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      setResolvedTheme('light');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyTheme(newTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
