import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  clearLfxMeetingsCache,
  filterMeetingsByRange,
  lfxMeetingInstanceKey,
  mapLfxMeetingToEvent,
  loadLfxMeetingsInRange,
} from './lfx-meetings.js';

afterEach(() => {
  clearLfxMeetingsCache();
  vi.unstubAllGlobals();
});

describe('mapLfxMeetingToEvent', () => {
  it('maps share_url into url/location/description for invite + dial-in', () => {
    const event = mapLfxMeetingToEvent({
      id: 'abc',
      title: 'FDC3 General Meeting',
      start: '2026-09-25T13:15:00Z',
      end: '2026-09-25T14:00:00.000+00:00',
      extendedProps: {
        agenda: 'Weekly sync',
        share_url:
          'https://zoom-lfx.platform.linuxfoundation.org/meeting/1?password=x',
        project_slug: 'fdc3',
        project: { Name: 'FDC3', Slug: 'fdc3' },
        meeting_id: '1',
      },
    });

    expect(event).toEqual({
      id: '1:2026-09-25T13:15:00Z',
      title: 'FDC3 General Meeting',
      start: '2026-09-25T13:15:00Z',
      end: '2026-09-25T14:00:00.000+00:00',
      url: 'https://zoom-lfx.platform.linuxfoundation.org/meeting/1?password=x',
      extendedProps: {
        location:
          'https://zoom-lfx.platform.linuxfoundation.org/meeting/1?password=x',
        description:
          'Weekly sync\n\nWays to join meeting:\n\nhttps://zoom-lfx.platform.linuxfoundation.org/meeting/1?password=x',
        projectSlug: 'fdc3',
        projectName: 'FDC3',
        meetingId: '1',
      },
    });
  });

  it('keeps concurrent meetings distinct when LFX reuses start-time ids', () => {
    const a = mapLfxMeetingToEvent({
      id: '1791381600',
      title: 'AI Governance Framework Working Session',
      start: '2026-10-07T14:00:00Z',
      extendedProps: { meeting_id: '97158459687' },
    });
    const b = mapLfxMeetingToEvent({
      id: '1791381600',
      title: 'Open Source Readiness SIG',
      start: '2026-10-07T14:00:00Z',
      extendedProps: { meeting_id: '99536057059' },
    });
    expect(a.id).not.toBe(b.id);
    expect(lfxMeetingInstanceKey({
      id: '1791381600',
      start: '2026-10-07T14:00:00Z',
      extendedProps: { meeting_id: '97158459687' },
    })).toBe('97158459687:2026-10-07T14:00:00Z');
  });
});

describe('filterMeetingsByRange', () => {
  it('keeps meetings whose start falls in range', () => {
    const meetings = [
      { id: 1, start: '2026-09-01T12:00:00Z' },
      { id: 2, start: '2026-10-01T12:00:00Z' },
      { id: 3, start: '2026-11-01T12:00:00Z' },
    ];
    const filtered = filterMeetingsByRange(
      meetings,
      Date.parse('2026-09-15T00:00:00Z'),
      Date.parse('2026-10-15T00:00:00Z')
    );
    expect(filtered.map((m) => m.id)).toEqual([2]);
  });
});

describe('loadLfxMeetingsInRange', () => {
  it('filters the upcoming feed to the requested window', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          meetings: [
            {
              id: 'in',
              title: 'In range',
              start: '2026-09-25T13:00:00Z',
              end: '2026-09-25T14:00:00Z',
              extendedProps: {
                agenda: 'Hi',
                share_url:
                  'https://zoom-lfx.platform.linuxfoundation.org/meeting/1?password=x',
              },
            },
            {
              id: 'out',
              title: 'Out of range',
              start: '2027-01-01T13:00:00Z',
              end: '2027-01-01T14:00:00Z',
              extendedProps: {},
            },
          ],
        }),
      }))
    );

    const events = await loadLfxMeetingsInRange(
      '2026-09-01T00:00:00Z',
      '2026-10-01T00:00:00Z'
    );
    expect(events).toHaveLength(1);
    expect(events[0].title).toBe('In range');
    expect(events[0].extendedProps.projectSlug).toBe('');
  });

  it('keeps concurrent meetings that share the LFX start-time id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          meetings: [
            {
              id: '1791381600',
              title: 'AI Governance Framework Working Session',
              start: '2026-10-07T14:00:00Z',
              end: '2026-10-07T15:00:00Z',
              extendedProps: { meeting_id: '97158459687' },
            },
            {
              id: '1791381600',
              title: 'Open Source Readiness SIG',
              start: '2026-10-07T14:00:00Z',
              end: '2026-10-07T15:00:00Z',
              extendedProps: { meeting_id: '99536057059' },
            },
          ],
        }),
      }))
    );

    const events = await loadLfxMeetingsInRange(
      '2026-10-01T00:00:00Z',
      '2026-10-15T00:00:00Z'
    );
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.title).sort()).toEqual([
      'AI Governance Framework Working Session',
      'Open Source Readiness SIG',
    ]);
  });
});
