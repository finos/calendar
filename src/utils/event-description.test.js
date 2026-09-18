import { describe, expect, it } from 'vitest';

import {
  isHttpUrl,
  normalizeDialInDetails,
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

  it('strips Zoom recurring-meeting invite boilerplate', () => {
    const raw =
      'You have been invited to a recurring meeting for Accessibility Theme Builder Project Meeting\n\nWeekly sync for a11y theme work.\n\nWays to join meeting:\n\nhttps://zoom-lfx.example/join';
    const result = splitMeetingDescription(raw);
    expect(result.summary).toBe('Weekly sync for a11y theme work.');
    expect(result.summary).not.toMatch(/You have been invited/i);
    expect(result.details).toContain('Ways to join meeting');
  });

  it('still finds dial-in details when Ways to join is the first line', () => {
    const raw =
      'You have been invited to a recurring meeting for CDM Working Group\nWays to join meeting:\n\nhttps://zoom-lfx.example/join\nMeeting ID: 123';
    const result = splitMeetingDescription(raw);
    expect(result.summary).toBe('');
    expect(result.details).toContain('Ways to join meeting');
    expect(result.details).toContain('zoom-lfx.example');
    expect(result.details).toContain('Meeting ID:');
  });
});

describe('normalizeDialInDetails', () => {
  it('puts meeting id, passcode, and phone numbers on their own lines', () => {
    const raw =
      'Ways to join meeting: Join Zoom Meeting https://zoom.example/j/1 Meeting ID: 123 456 Passcode: abc One tap mobile +1 5551112222,,123# Dial by your location +1 5553334444 US';
    const normalized = normalizeDialInDetails(raw);
    expect(normalized).toContain('\nMeeting ID:');
    expect(normalized).toContain('\nPasscode:');
    expect(normalized).toContain('\n\nOne tap mobile');
    expect(normalized).toContain('\n\nDial by your location');
    expect(normalized.split('\n').some((line) => line.includes('+1'))).toBe(
      true
    );
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
