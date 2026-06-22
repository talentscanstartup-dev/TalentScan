import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('talentscan-theme') || 'default';
  });

  const [accentColor, setAccentColorState] = useState(() => {
    return localStorage.getItem('talentscan-accent') || '#8b5cf6';
  });

  const [backgroundColor, setBackgroundColorState] = useState(() => {
    return localStorage.getItem('talentscan-bg') || 'gradient-purple';
  });

  useEffect(() => {
    localStorage.setItem('talentscan-theme', theme);
    const html = document.documentElement;
    
    // Remover inline styles antigos para que as variáveis do CSS (por data-theme) prevaleçam
    html.style.removeProperty('--bg-gradient');
    html.style.removeProperty('--bg-page');
    html.style.removeProperty('--text-primary');
    html.style.removeProperty('--text-secondary');
    
    html.setAttribute('data-theme', theme);
    html.classList.remove('theme-light', 'theme-dark', 'theme-default');
    html.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('talentscan-accent', accentColor);
    document.documentElement.style.setProperty('--accent-color-custom', accentColor);
  }, [accentColor]);

  useEffect(() => {
    localStorage.setItem('talentscan-bg', backgroundColor);
    document.documentElement.setAttribute('data-bg', backgroundColor);
  }, [backgroundColor]);

  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const setAccentColor = (color) => {
    setAccentColorState(color);
  };

  const setBackgroundColor = (bg) => {
    setBackgroundColorState(bg);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      accentColor,
      setAccentColor,
      backgroundColor,
      setBackgroundColor,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
};
