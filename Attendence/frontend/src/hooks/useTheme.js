import { useState, useEffect } from 'react';
import { storage } from '../services/storage';

export function useTheme() {
  const [theme, setTheme] = useState(() => storage.getTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    storage.setTheme(next);
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const setThemeDirect = (t) => {
    storage.setTheme(t);
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
  };

  return { theme, toggleTheme, setTheme: setThemeDirect };
}

