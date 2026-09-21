import { describe, expect, it } from 'vitest';

import { createLfxMeetingsEventSource } from './lfx-meetings.js';

describe('createLfxMeetingsEventSource', () => {
  it('requests the visible range and returns events', async () => {
    const originalFetch = globalThis.fetch;
    const calls = [];
    globalThis.fetch = async (url) => {
      calls.push(String(url));
      return {
        ok: true,
        json: async () => ({
          events: [
            {
              id: '1',
              title: 'Meeting',
              start: '2026-09-25T13:00:00Z',
              end: '2026-09-25T14:00:00Z',
            },
          ],
        }),
      };
    };

    try {
      const source = createLfxMeetingsEventSource('/api/lfx-meetings');
      const events = await new Promise((resolve, reject) => {
        source(
          {
            start: new Date('2026-09-01T00:00:00Z'),
            end: new Date('2026-10-01T00:00:00Z'),
            startStr: '2026-09-01T00:00:00Z',
            endStr: '2026-10-01T00:00:00Z',
          },
          resolve,
          reject
        );
      });
      expect(calls[0]).toContain('/api/lfx-meetings?');
      expect(calls[0]).toContain('start=');
      expect(calls[0]).toContain('end=');
      expect(events).toHaveLength(1);
      expect(events[0].title).toBe('Meeting');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
