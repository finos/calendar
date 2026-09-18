import { describe, expect, it } from 'vitest';

import {
  isMeetingJoinUrl,
  replaceMeetingJoinUrlsWithAnchorTags,
} from './url-to-link.js';

describe('isMeetingJoinUrl', () => {
  it('accepts LFX and Zoom meeting join links', () => {
    expect(
      isMeetingJoinUrl(
        'https://zoom-lfx.platform.linuxfoundation.org/meeting/92954837989?password=1c6fbd94-f68a-4236-b1e5-06da91399535'
      )
    ).toBe(true);
    expect(isMeetingJoinUrl('https://zoom.us/j/123456789')).toBe(true);
    expect(isMeetingJoinUrl('https://us02web.zoom.us/j/123456789')).toBe(true);
  });

  it('rejects other urls', () => {
    expect(isMeetingJoinUrl('https://zoom.us/pricing')).toBe(false);
    expect(
      isMeetingJoinUrl('https://zoom-lfx.platform.linuxfoundation.org/meetings/finos')
    ).toBe(false);
    expect(isMeetingJoinUrl('https://finos.org')).toBe(false);
  });
});

describe('replaceMeetingJoinUrlsWithAnchorTags', () => {
  it('linkifies only the meeting join url', () => {
    const text =
      'Ways to join meeting:\nhttps://zoom-lfx.platform.linuxfoundation.org/meeting/92954837989?password=abc\nFind your local number: https://zoom.us/u/local\nMeeting ID: 123';
    const html = replaceMeetingJoinUrlsWithAnchorTags(text).replace(
      /\n/g,
      '<br />'
    );
    expect(html).toContain(
      '<a href="https://zoom-lfx.platform.linuxfoundation.org/meeting/92954837989?password=abc">https://zoom-lfx.platform.linuxfoundation.org/meeting/92954837989?password=abc</a>'
    );
    expect(html).toContain('https://zoom.us/u/local');
    expect(html).not.toContain('href="https://zoom.us/u/local"');
    expect(html).toContain('Meeting ID: 123');
  });
});
