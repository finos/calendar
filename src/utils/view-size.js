export function isBrowser() {
  return typeof window !== 'undefined';
}

/** Matches App.css mobile breakpoint (max-width: 600px). */
export function isMinWidth() {
  if (!isBrowser()) return true;
  return window.matchMedia('(min-width: 601px)').matches;
}

export function getAspectRatio() {
  if (!isBrowser()) return 1.35;
  return window.innerWidth > window.innerHeight
    ? 1.35
    : window.innerWidth / window.innerHeight;
}

export function getInitialView() {
  if (!isBrowser()) {
    return 'dayGridMonth';
  }
  // Phones default to day; larger screens open on month.
  return isMinWidth() ? 'dayGridMonth' : 'dayGridDay';
}
