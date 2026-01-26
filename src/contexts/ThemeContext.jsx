import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  LEGACY: 'legacy',
  FABOS: 'fabos'
};

// ============================================================================
// DEFAULT THEME CONFIGURATION
// ============================================================================
// FabOS is the default and only active theme.
// Legacy theme is hidden from users but code remains for potential future use.
// ============================================================================
const DEFAULT_THEME = THEMES.FABOS;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if theme was selected before, otherwise use default (FabOS)
    const savedTheme = localStorage.getItem('fabos-selected-theme');
    const themeToUse = savedTheme || DEFAULT_THEME;

    setTheme(themeToUse);
    document.body.classList.add(`theme-${themeToUse}`);

    // Save default theme if none was set
    if (!savedTheme) {
      localStorage.setItem('fabos-selected-theme', DEFAULT_THEME);
    }

    setIsLoading(false);
  }, []);

  const selectTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('fabos-selected-theme', newTheme);

    // Update body class
    document.body.classList.remove('theme-legacy', 'theme-fabos');
    document.body.classList.add(`theme-${newTheme}`);
  };

  const clearTheme = () => {
    setTheme(null);
    localStorage.removeItem('fabos-selected-theme');
    document.body.classList.remove('theme-legacy', 'theme-fabos');
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      selectTheme,
      clearTheme,
      isLoading,
      isLegacy: theme === THEMES.LEGACY,
      isFabOS: theme === THEMES.FABOS
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
