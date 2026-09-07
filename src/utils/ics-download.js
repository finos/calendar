function pad(value) {
  return String(value).padStart(2, '0');
}

function formatIcsUtc(date) {
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcs(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function foldIcsLine(line) {
  if (line.length <= 75) return line;
  const parts = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length) {
    parts.push(' ' + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join('\r\n');
}

export function eventToIcs(event) {
  const uid = event.id || event.extendedProps?.uid || crypto.randomUUID();
  const start = event.start instanceof Date ? event.start : new Date(event.start);
  const end = event.end
    ? event.end instanceof Date
      ? event.end
      : new Date(event.end)
    : start;
  const description = event.extendedProps?.description || '';
  const location = event.extendedProps?.location || '';
  const url = event.url || '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FINOS//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtc(new Date())}`,
    `DTSTART:${formatIcsUtc(start)}`,
    `DTEND:${formatIcsUtc(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
  ];

  if (description) lines.push(`DESCRIPTION:${escapeIcs(description)}`);
  if (location) lines.push(`LOCATION:${escapeIcs(location)}`);
  if (url) lines.push(`URL:${url}`);

  lines.push('END:VEVENT', 'END:VCALENDAR', '');

  return lines.map(foldIcsLine).join('\r\n');
}

export function downloadICSFile(eventDetails) {
  const ics =
    eventDetails.extendedProps?.ics || eventToIcs(eventDetails);
  const file = new Blob([ics], { type: 'text/calendar' });
  const element = document.createElement('a');
  const href = URL.createObjectURL(file);
  element.href = href;
  element.download = 'finos-event.ics';
  document.body.appendChild(element);
  element.click();
  element.remove();
  URL.revokeObjectURL(href);
}
