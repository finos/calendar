export function splitMeetingDescription(raw) {
  if (!raw) return { summary: '', details: '' };

  const text = String(raw).replace(/\r\n/g, '\n').trim();
  const match = text.split(/\n\s*Ways to join meeting:?/i);
  if (match.length > 1) {
    return {
      summary: match[0].trim(),
      details: `Ways to join meeting:${match.slice(1).join('Ways to join meeting:')}`.trim(),
    };
  }
  return { summary: text, details: '' };
}

export function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}
