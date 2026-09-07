import { describe, expect, it } from 'vitest';

import { hiddenWeekendDays, sameHiddenDays } from './hidden-weekends.js';

const viewStart = new Date(2026, 7, 31);
const viewEnd = new Date(2026, 8, 7);

describe('hiddenWeekendDays', () => {
  it('hides Saturday and Sunday when the view has no events', () => {
    expect(hiddenWeekendDays([], viewStart, viewEnd)).toEqual([0, 6]);
  });

  it('keeps Saturday when an event falls on Saturday', () => {
    const ranges = [
      {
        start: new Date(2026, 8, 5, 10, 0, 0),
        end: new Date(2026, 8, 5, 11, 0, 0),
      },
    ];
    expect(hiddenWeekendDays(ranges, viewStart, viewEnd)).toEqual([0]);
  });

  it('keeps Sunday when an event falls on Sunday', () => {
    const ranges = [
      {
        start: new Date(2026, 8, 6, 10, 0, 0),
        end: new Date(2026, 8, 6, 11, 0, 0),
      },
    ];
    expect(hiddenWeekendDays(ranges, viewStart, viewEnd)).toEqual([6]);
  });

  it('keeps both weekend days when events fall on each', () => {
    const ranges = [
      {
        start: new Date(2026, 8, 5, 10, 0, 0),
        end: new Date(2026, 8, 5, 11, 0, 0),
      },
      {
        start: new Date(2026, 8, 6, 10, 0, 0),
        end: new Date(2026, 8, 6, 11, 0, 0),
      },
    ];
    expect(hiddenWeekendDays(ranges, viewStart, viewEnd)).toEqual([]);
  });

  it('does not count Friday events as weekend', () => {
    const ranges = [
      {
        start: new Date(2026, 8, 4, 10, 0, 0),
        end: new Date(2026, 8, 4, 11, 0, 0),
      },
    ];
    expect(hiddenWeekendDays(ranges, viewStart, viewEnd)).toEqual([0, 6]);
  });
});

describe('sameHiddenDays', () => {
  it('compares weekend hide lists', () => {
    expect(sameHiddenDays([0, 6], [0, 6])).toBe(true);
    expect(sameHiddenDays([0], [0, 6])).toBe(false);
  });
});
