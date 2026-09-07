import { useEffect, useState } from 'react';

import {
  applyTheme,
  getResolvedTheme,
  getSystemTheme,
  persistTheme,
} from '../utils/theme.js';

export default function useTheme() {
  const [theme, setTheme] = useState(getResolvedTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (!window.localStorage.getItem('finos-calendar-theme')) {
        setTheme(getSystemTheme());
      }
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    persistTheme(next);
    setTheme(next);
  };

  return { theme, toggleTheme };
}
