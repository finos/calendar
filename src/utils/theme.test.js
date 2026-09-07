import { describe, expect, it, beforeEach } from 'vitest';

/**
 * @vitest-environment jsdom
 */

import {
  applyTheme,
  getResolvedTheme,
  getSavedTheme,
  persistTheme,
} from './theme.js';

describe('theme', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.dataset.theme = '';
  });

  it('defaults to the system preference when nothing is saved', () => {
    expect(getSavedTheme()).toBeNull();
    expect(['light', 'dark']).toContain(getResolvedTheme());
  });

  it('uses an explicit saved theme over the system default', () => {
    persistTheme('dark');
    expect(getSavedTheme()).toBe('dark');
    expect(getResolvedTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('applies the theme to the document', () => {
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
