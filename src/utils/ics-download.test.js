import { describe, expect, it } from 'vitest';

import { eventToIcs } from './ics-download.js';

describe('eventToIcs', () => {
  it('builds a VEVENT from a FullCalendar event', () => {
    const ics = eventToIcs({
      id: 'abc-123',
      title: 'Town hall, FINOS',
      start: new Date('2026-03-17T14:00:00Z'),
      end: new Date('2026-03-17T15:00:00Z'),
      url: 'https://example.com',
      extendedProps: {
        description: 'Hello; world',
        location: 'Virtual',
      },
    });

    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:abc-123');
    expect(ics).toContain('SUMMARY:Town hall\\, FINOS');
    expect(ics).toContain('DESCRIPTION:Hello\\; world');
    expect(ics).toContain('LOCATION:Virtual');
    expect(ics).toContain('URL:https://example.com');
    expect(ics).toContain('DTSTART:20260317T140000Z');
  });
});
