import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  LEGACY: 'legacy',
  FABOS: 'fabos'
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if theme was selected before
    const savedTheme = localStorage.getItem('fabos-selected-theme');
    if (savedTheme) {
      setTheme(savedTheme);
      document.body.classList.add(`theme-${savedTheme}`);
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
