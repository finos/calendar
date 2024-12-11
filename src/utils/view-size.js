export function isBrowser() {
  return typeof window !== 'undefined';
}

export function isMinWidth() {
  return isBrowser() ? window.outerWidth > 600 : true;
}

export function getAspectRatio() {
  return isBrowser()
    ? window.outerWidth > window.innerHeight
      ? 1.35
      : window.innerWidth / window.innerHeight
    : 1.35;
}

export function getInitialView() {
  return isBrowser()
    ? window.outerWidth > 600
      ? 'dayGridMonth'
      : 'timeGridWeek'
    : 'dayGridMonth';
}
