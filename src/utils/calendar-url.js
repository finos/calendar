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

const FILTER_ALIASES = {
  all: 'all',
  events: 'custom',
  event: 'custom',
  custom: 'custom',
  meetings: 'lfx',
  meeting: 'lfx',
  'project-meetings': 'lfx',
  'project-meeting': 'lfx',
  lfx: 'lfx',
};

const FILTER_TO_ALIAS = {
  custom: 'events',
  lfx: 'meetings',
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

export function parseCalendarFilter(value, fallback = 'all') {
  if (value == null || value === '') return fallback;
  const alias = String(value).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(FILTER_ALIASES, alias)
    ? FILTER_ALIASES[alias]
    : fallback;
}

export function filterAliasFromId(feedFilter) {
  return FILTER_TO_ALIAS[feedFilter] || null;
}

export function parseCalendarSearch(value, fallback = '') {
  if (value == null) return fallback;
  return String(value);
}

export function searchAliasFromTerm(searchTerm) {
  const value = String(searchTerm || '');
  return value.trim() ? value : null;
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

export function calendarUrlState(
  viewType,
  date,
  feedFilter = 'all',
  searchTerm = ''
) {
  return {
    view: viewAliasFromType(viewType),
    date: formatCalendarDate(date),
    filter: filterAliasFromId(feedFilter),
    q: searchAliasFromTerm(searchTerm),
  };
}

export function calendarUrlNeedsUpdate(searchParams, next) {
  if (!next.view || !next.date) return false;
  const currentFilter = searchParams.get('filter');
  const filterMismatch = next.filter
    ? currentFilter !== next.filter
    : currentFilter != null && currentFilter !== '';
  const currentQ = searchParams.get('q') || '';
  const nextQ = next.q || '';
  return (
    searchParams.get('view') !== next.view ||
    searchParams.get('date') !== next.date ||
    filterMismatch ||
    currentQ !== nextQ
  );
}

export function applyCalendarUrlState(params, next) {
  const nextParams = new URLSearchParams(params);
  nextParams.set('view', next.view);
  nextParams.set('date', next.date);
  if (next.filter) {
    nextParams.set('filter', next.filter);
  } else {
    nextParams.delete('filter');
  }
  if (next.q) {
    nextParams.set('q', next.q);
  } else {
    nextParams.delete('q');
  }
  return nextParams;
}
