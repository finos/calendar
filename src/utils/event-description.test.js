import { describe, expect, it } from 'vitest';

import {
  isHttpUrl,
  splitMeetingDescription,
} from './event-description.js';

describe('splitMeetingDescription', () => {
  it('keeps a short description intact', () => {
    expect(splitMeetingDescription('Working group call')).toEqual({
      summary: 'Working group call',
      details: '',
    });
  });

  it('splits LFX join instructions out of the summary', () => {
    const raw =
      'FDC3 General Meeting\n\nWays to join meeting:\n\nhttps://zoom-lfx.example/join';
    const result = splitMeetingDescription(raw);
    expect(result.summary).toBe('FDC3 General Meeting');
    expect(result.details).toContain('Ways to join meeting');
    expect(result.details).toContain('zoom-lfx.example');
  });
});

describe('isHttpUrl', () => {
  it('detects http(s) locations', () => {
    expect(isHttpUrl('https://zoom-lfx.platform.linuxfoundation.org/meeting/1')).toBe(
      true
    );
    expect(isHttpUrl('New York')).toBe(false);
  });
});
