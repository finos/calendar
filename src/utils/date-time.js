const dateOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const timeOptions = {
  hour: '2-digit',
  minute: '2-digit',
  timeZoneName: 'short',
};

export function printDate(date) {
  if (date) {
    return date.toLocaleDateString(undefined, dateOptions);
  }
  return 'NONE';
}

export function printTime(date) {
  if (date) {
    return date.toLocaleTimeString(undefined, timeOptions);
  }
  return 'NONE';
}

export function userTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local';
}

/** True when the event's end (or start if no end) is before now. */
export function eventHasEnded(event, now = Date.now()) {
  if (!event) return false;
  const end = event.end || event.start;
  if (!end) return false;
  const endMs = end instanceof Date ? +end : Date.parse(end);
  return !Number.isNaN(endMs) && endMs < now;
}
