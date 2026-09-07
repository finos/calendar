const STORAGE_KEY = 'finos-calendar-theme';

export function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function getSavedTheme() {
  if (typeof window === 'undefined') return null;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === 'light' || saved === 'dark' ? saved : null;
}

export function getResolvedTheme() {
  return getSavedTheme() || getSystemTheme();
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  const themeColor = document.getElementById('theme-color-meta');
  if (themeColor) {
    themeColor.content = theme === 'dark' ? '#0a3a48' : '#00b5e2';
  }
}

export function persistTheme(theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}
