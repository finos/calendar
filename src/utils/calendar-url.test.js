import { describe, expect, it } from 'vitest';

import {
  calendarUrlNeedsUpdate,
  calendarUrlState,
  formatCalendarDate,
  parseCalendarDate,
  parseCalendarView,
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

describe('formatCalendarDate / calendarUrlState', () => {
  it('formats local dates as YYYY-MM-DD', () => {
    expect(formatCalendarDate(new Date(2026, 8, 16))).toBe('2026-09-16');
  });

  it('builds shareable url state from calendar state', () => {
    expect(calendarUrlState('dayGridWeek', new Date(2026, 8, 16))).toEqual({
      view: 'week',
      date: '2026-09-16',
    });
  });
});

describe('calendarUrlNeedsUpdate', () => {
  it('detects when params already match', () => {
    const params = new URLSearchParams('view=day&date=2026-09-16');
    expect(
      calendarUrlNeedsUpdate(params, { view: 'day', date: '2026-09-16' })
    ).toBe(false);
    expect(
      calendarUrlNeedsUpdate(params, { view: 'month', date: '2026-09-16' })
    ).toBe(true);
  });
});
