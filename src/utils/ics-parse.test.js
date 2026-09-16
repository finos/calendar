import { afterEach, describe, expect, it } from 'vitest';
import ICAL from 'ical.js';

import { parseIcsEvents, parseIcsFullCalendarEvents } from './ics-parse.js';

const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:standup-1
SUMMARY:Standup
DTSTART:20260831T150000Z
DTEND:20260831T160000Z
RRULE:FREQ=DAILY;COUNT=3
URL:https://zoom-lfx.platform.linuxfoundation.org/meeting/1?password=x
END:VEVENT
END:VCALENDAR
`;

const tzIcs = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTIMEZONE
TZID:America/New_York
BEGIN:STANDARD
TZOFFSETFROM:-0400
TZOFFSETTO:-0500
TZNAME:EST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
BEGIN:DAYLIGHT
TZOFFSETFROM:-0500
TZOFFSETTO:-0400
TZNAME:EDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
UID:ny-1
SUMMARY:NY meeting
DTSTART;TZID=America/New_York:20261025T100000
DTEND;TZID=America/New_York:20261025T110000
END:VEVENT
END:VCALENDAR
`;

afterEach(() => {
  ICAL.TimezoneService.reset();
});

describe('parseIcsEvents', () => {
  it('expands RRULE occurrences within the requested range', () => {
    const events = parseIcsEvents(
      ics,
      new Date('2026-08-31T00:00:00Z'),
      new Date('2026-09-10T00:00:00Z')
    );

    expect(events).toHaveLength(3);
    expect(events[0].title).toBe('Standup');
    expect(events[0].url).toContain('zoom-lfx.platform.linuxfoundation.org');
    expect(events.map((event) => event.start.toISOString())).toEqual([
      '2026-08-31T15:00:00.000Z',
      '2026-09-01T15:00:00.000Z',
      '2026-09-02T15:00:00.000Z',
    ]);
  });

  it('converts TZID times to absolute instants using VTIMEZONE', () => {
    const events = parseIcsEvents(
      tzIcs,
      new Date('2026-10-25T00:00:00Z'),
      new Date('2026-10-26T00:00:00Z')
    );

    expect(events).toHaveLength(1);
    // 10:00 America/New_York (EDT, UTC-4) => 14:00Z
    expect(events[0].start.toISOString()).toBe('2026-10-25T14:00:00.000Z');
    expect(events[0].end.toISOString()).toBe('2026-10-25T15:00:00.000Z');
  });
});

describe('parseIcsFullCalendarEvents', () => {
  it('emits UTC ISO strings so FullCalendar can shift to the user timezone', () => {
    const events = parseIcsFullCalendarEvents(
      tzIcs,
      new Date('2026-10-25T00:00:00Z'),
      new Date('2026-10-26T00:00:00Z')
    );

    expect(events).toEqual([
      expect.objectContaining({
        title: 'NY meeting',
        start: '2026-10-25T14:00:00.000Z',
        end: '2026-10-25T15:00:00.000Z',
        allDay: false,
      }),
    ]);
  });
});
