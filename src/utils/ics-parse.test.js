import { describe, expect, it } from 'vitest';

import { parseIcsEvents } from './ics-parse.js';

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
});
