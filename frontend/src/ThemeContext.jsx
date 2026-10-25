import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'ledger-theme';

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        // Default to light mode
        setTheme('light');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      // Fallback to light mode
      setTheme('light');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    setIsInitialized(true);
  }, []);

  // Update theme and persist to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isInitialized }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
