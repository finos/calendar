import { describe, expect, it } from 'vitest';

import {
  extractIcsBlocks,
  foldIcsText,
  mergeIcsCalendars,
  pathToIcsKind,
  trimIcsToWindow,
} from './ics-feed.js';

const calendarA = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTIMEZONE
TZID:America/New_York
END:VTIMEZONE
BEGIN:VEVENT
UID:lfx-1
SUMMARY:LFX Meeting
DTSTART:20260317T140000Z
DTEND:20260317T150000Z
END:VEVENT
END:VCALENDAR
`;

const calendarB = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTIMEZONE
TZID:America/New_York
END:VTIMEZONE
BEGIN:VEVENT
UID:custom-1
SUMMARY:Custom Event
DTSTART:20260318T140000Z
DTEND:20260318T150000Z
END:VEVENT
END:VCALENDAR
`;

describe('mergeIcsCalendars', () => {
  it('keeps UIDs from both sources and dedupes timezones', () => {
    const merged = mergeIcsCalendars([calendarA, calendarB]);
    expect(merged).toContain('UID:lfx-1');
    expect(merged).toContain('UID:custom-1');
    expect(merged).toContain('SUMMARY:LFX Meeting');
    expect(merged).toContain('SUMMARY:Custom Event');
    expect(extractIcsBlocks(merged, 'VTIMEZONE')).toHaveLength(1);
    expect(extractIcsBlocks(merged, 'VEVENT')).toHaveLength(2);
  });
});

describe('pathToIcsKind', () => {
  it('maps feed paths', () => {
    expect(pathToIcsKind('/feeds/lfx.ics')).toBe('lfx');
    expect(pathToIcsKind('/feeds/custom.ics')).toBe('custom');
    expect(pathToIcsKind('/calendar.ics')).toBe('merged');
    expect(pathToIcsKind('/')).toBeNull();
  });
});

describe('foldIcsText', () => {
  it('folds lines longer than 75 characters', () => {
    const folded = foldIcsText('SUMMARY:' + 'A'.repeat(80));
    expect(folded.split('\r\n')[0].length).toBe(75);
    expect(folded).toContain('\r\n ');
  });
});

describe('trimIcsToWindow', () => {
  it('keeps in-window and recurring events, drops old one-offs', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:old
SUMMARY:Old
DTSTART:20200101T140000Z
DTEND:20200101T150000Z
END:VEVENT
BEGIN:VEVENT
UID:now
SUMMARY:Now
DTSTART:20260831T140000Z
DTEND:20260831T150000Z
END:VEVENT
BEGIN:VEVENT
UID:series
SUMMARY:Series
DTSTART:20200101T140000Z
DTEND:20200101T150000Z
RRULE:FREQ=WEEKLY
END:VEVENT
END:VCALENDAR
`;
    const trimmed = trimIcsToWindow(ics, new Date('2026-08-31T00:00:00Z'));
    const uids = extractIcsBlocks(trimmed, 'VEVENT').map((block) => {
      const match = block.match(/^UID:(.+)$/m);
      return match ? match[1] : '';
    });
    expect(uids).toEqual(['now', 'series']);
  });

  it('drops one-off events older than one month', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:two-months-ago
SUMMARY:Too old
DTSTART:20260615T140000Z
DTEND:20260615T150000Z
END:VEVENT
BEGIN:VEVENT
UID:this-month
SUMMARY:Recent
DTSTART:20260810T140000Z
DTEND:20260810T150000Z
END:VEVENT
END:VCALENDAR
`;
    const trimmed = trimIcsToWindow(ics, new Date('2026-08-31T00:00:00Z'));
    const uids = extractIcsBlocks(trimmed, 'VEVENT').map((block) => {
      const match = block.match(/^UID:(.+)$/m);
      return match ? match[1] : '';
    });
    expect(uids).toEqual(['this-month']);
  });
});
