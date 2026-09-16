import { describe, expect, it } from 'vitest';

import {
  applyCalendarUrlState,
  calendarUrlNeedsUpdate,
  calendarUrlState,
  filterAliasFromId,
  formatCalendarDate,
  parseCalendarDate,
  parseCalendarFilter,
  parseCalendarSearch,
  parseCalendarView,
  searchAliasFromTerm,
  viewAliasFromType,
} from './calendar-url.js';

describe('parseCalendarView', () => {
  it('maps friendly aliases to FullCalendar views', () => {
    expect(parseCalendarView('month', 'fallback')).toBe('dayGridMonth');
    expect(parseCalendarView('WEEK', 'fallback')).toBe('dayGridWeek');
    expect(parseCalendarView(' day ', 'fallback')).toBe('dayGridDay');
  });

  it('falls back for missing or unknown values', () => {
    expect(parseCalendarView(null, 'dayGridMonth')).toBe('dayGridMonth');
    expect(parseCalendarView('agenda', 'dayGridMonth')).toBe('dayGridMonth');
  });
});

describe('viewAliasFromType', () => {
  it('maps FullCalendar views back to aliases', () => {
    expect(viewAliasFromType('dayGridMonth')).toBe('month');
    expect(viewAliasFromType('dayGridWeek')).toBe('week');
    expect(viewAliasFromType('dayGridDay')).toBe('day');
    expect(viewAliasFromType('timeGridWeek')).toBe(null);
  });
});

describe('parseCalendarFilter', () => {
  it('maps events and meetings aliases to feed ids', () => {
    expect(parseCalendarFilter('events')).toBe('custom');
    expect(parseCalendarFilter('Events')).toBe('custom');
    expect(parseCalendarFilter('meetings')).toBe('lfx');
    expect(parseCalendarFilter('project-meetings')).toBe('lfx');
    expect(parseCalendarFilter('lfx')).toBe('lfx');
    expect(parseCalendarFilter('custom')).toBe('custom');
  });

  it('treats missing or unknown values as all', () => {
    expect(parseCalendarFilter(null)).toBe('all');
    expect(parseCalendarFilter('')).toBe('all');
    expect(parseCalendarFilter('all')).toBe('all');
    expect(parseCalendarFilter('unknown', 'all')).toBe('all');
  });
});

describe('filterAliasFromId', () => {
  it('maps feed ids to shareable aliases and omits all', () => {
    expect(filterAliasFromId('custom')).toBe('events');
    expect(filterAliasFromId('lfx')).toBe('meetings');
    expect(filterAliasFromId('all')).toBe(null);
  });
});

describe('parseCalendarDate', () => {
  it('accepts valid YYYY-MM-DD values', () => {
    expect(parseCalendarDate('2026-09-16', null)).toBe('2026-09-16');
  });

  it('rejects invalid or impossible dates', () => {
    expect(parseCalendarDate('09-16-2026', '2026-01-01')).toBe('2026-01-01');
    expect(parseCalendarDate('2026-02-31', null)).toBe(null);
    expect(parseCalendarDate('', '2026-01-01')).toBe('2026-01-01');
  });
});

describe('parseCalendarSearch / searchAliasFromTerm', () => {
  it('preserves search text and omits blank values from the url', () => {
    expect(parseCalendarSearch('FINOS Summit')).toBe('FINOS Summit');
    expect(parseCalendarSearch(null)).toBe('');
    expect(searchAliasFromTerm('  town hall  ')).toBe('  town hall  ');
    expect(searchAliasFromTerm('   ')).toBe(null);
    expect(searchAliasFromTerm('')).toBe(null);
  });
});

describe('formatCalendarDate / calendarUrlState', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(formatCalendarDate(new Date(2026, 8, 16))).toBe('2026-09-16');
  });

  it('builds shareable url state from calendar state', () => {
    expect(
      calendarUrlState('dayGridWeek', new Date(2026, 8, 16), 'custom', 'summit')
    ).toEqual({
      view: 'week',
      date: '2026-09-16',
      filter: 'events',
      q: 'summit',
    });
    expect(
      calendarUrlState('dayGridMonth', new Date(2026, 8, 16), 'all', '')
    ).toEqual({
      view: 'month',
      date: '2026-09-16',
      filter: null,
      q: null,
    });
  });
});

describe('calendarUrlNeedsUpdate / applyCalendarUrlState', () => {
  it('detects when params already match', () => {
    const params = new URLSearchParams(
      'view=day&date=2026-09-16&filter=events&q=summit'
    );
    expect(
      calendarUrlNeedsUpdate(params, {
        view: 'day',
        date: '2026-09-16',
        filter: 'events',
        q: 'summit',
      })
    ).toBe(false);
    expect(
      calendarUrlNeedsUpdate(params, {
        view: 'day',
        date: '2026-09-16',
        filter: 'meetings',
        q: 'summit',
      })
    ).toBe(true);
    expect(
      calendarUrlNeedsUpdate(params, {
        view: 'day',
        date: '2026-09-16',
        filter: 'events',
        q: 'town',
      })
    ).toBe(true);
  });

  it('treats a missing filter as all', () => {
    const params = new URLSearchParams('view=month&date=2026-09-16');
    expect(
      calendarUrlNeedsUpdate(params, {
        view: 'month',
        date: '2026-09-16',
        filter: null,
        q: null,
      })
    ).toBe(false);
  });

  it('writes and clears filter and search params', () => {
    const withParams = applyCalendarUrlState(new URLSearchParams(), {
      view: 'week',
      date: '2026-09-16',
      filter: 'meetings',
      q: 'zoom',
    });
    expect(withParams.toString()).toBe(
      'view=week&date=2026-09-16&filter=meetings&q=zoom'
    );

    const cleared = applyCalendarUrlState(withParams, {
      view: 'week',
      date: '2026-09-16',
      filter: null,
      q: null,
    });
    expect(cleared.toString()).toBe('view=week&date=2026-09-16');
  });
});
