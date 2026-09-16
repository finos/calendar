const VIEW_ALIASES = {
  month: 'dayGridMonth',
  week: 'dayGridWeek',
  day: 'dayGridDay',
};

const VIEW_TO_ALIAS = {
  dayGridMonth: 'month',
  dayGridWeek: 'week',
  dayGridDay: 'day',
};

export function parseCalendarView(value, fallback) {
  if (value == null || value === '') return fallback;
  const alias = String(value).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(VIEW_ALIASES, alias)
    ? VIEW_ALIASES[alias]
    : fallback;
}

export function viewAliasFromType(viewType) {
  return VIEW_TO_ALIAS[viewType] || null;
}

export function parseCalendarDate(value, fallback = null) {
  if (value == null || value === '') return fallback;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (!match) return fallback;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return fallback;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function formatCalendarDate(date) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayCalendarDate() {
  return formatCalendarDate(new Date());
}

export function calendarUrlState(viewType, date) {
  return {
    view: viewAliasFromType(viewType),
    date: formatCalendarDate(date),
  };
}

export function calendarUrlNeedsUpdate(searchParams, next) {
  if (!next.view || !next.date) return false;
  return (
    searchParams.get('view') !== next.view ||
    searchParams.get('date') !== next.date
  );
}
