/**
 * Light / dark theme handling.
 * The initial class is applied by an inline script in <head> (no flash);
 * this module handles user toggles with a short colour cross-fade.
 */

export const THEME_STORAGE_KEY = 'zypher-theme';

export type Theme = 'light' | 'dark';

export const isDark = (): boolean => document.documentElement.classList.contains('dark');

export function setTheme(theme: Theme): void {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 650);
  }

  root.classList.toggle('dark', theme === 'dark');

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be unavailable (private mode); the toggle still works for this page.
  }
}
