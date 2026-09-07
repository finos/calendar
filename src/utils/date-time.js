const dateOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

const timeOptions = {
  hour: '2-digit',
  minute: '2-digit',
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
