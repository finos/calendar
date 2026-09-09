export function parseHighlightTitle(title) {
  const original = String(title || '');
  const highlighted = /\[\s*highlight\s*\]/i.test(original);
  const cleaned = original
    .replace(/\[\s*highlight\s*\]/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return {
    title: cleaned || original.trim(),
    highlighted,
  };
}

export function isHighlightedEvent(event) {
  return Boolean(event?.extendedProps?.highlighted);
}
