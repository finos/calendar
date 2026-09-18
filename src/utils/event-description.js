export function splitMeetingDescription(raw) {
  if (!raw) return { summary: '', details: '' };

  const text = stripInviteBoilerplate(
    String(raw).replace(/\r\n/g, '\n').trim()
  );
  // Marker may be mid-description or at the start (after invite boilerplate is removed).
  const marker = /(?:^|\n)\s*Ways to join meeting:?/i;
  const match = marker.exec(text);
  if (!match) {
    return { summary: text, details: '' };
  }

  const summary = text.slice(0, match.index).trim();
  const detailsBody = text.slice(match.index + match[0].length).trim();
  return {
    summary,
    details: normalizeDialInDetails(
      detailsBody
        ? `Ways to join meeting:\n\n${detailsBody}`
        : 'Ways to join meeting:'
    ),
  };
}

/** Drop Zoom/LFX "You have been invited…" intro lines from descriptions. */
export function stripInviteBoilerplate(text) {
  return String(text || '')
    .split('\n')
    .filter(
      (line) =>
        !/^\s*You have been invited to (a )?recurring meeting\b/i.test(line)
    )
    .join('\n')
    .replace(/^\n+/, '')
    .trim();
}

/**
 * Put common dial-in fields on their own lines when Zoom jams them together.
 */
export function normalizeDialInDetails(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .replace(/\s+(Meeting ID:)/gi, '\n$1')
    .replace(/\s+(Passcode:|Password:)/gi, '\n$1')
    .replace(/\s+(One tap mobile:?)/gi, '\n\n$1')
    .replace(/\s+(Dial by your location:?)/gi, '\n\n$1')
    .replace(/\s+(Find your local number:?)/gi, '\n\n$1')
    .replace(/\s+(Join Zoom Meeting)\b/g, '\n$1')
    .replace(/\s+(\+\d[\d*#,\s-]{6,}\d)/g, '\n$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}
