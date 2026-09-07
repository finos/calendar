import { describe, expect, it } from 'vitest';

import { eventInviteUrl, lfxInviteUrl } from './lfx-invite.js';

const LFX =
  'https://zoom-lfx.platform.linuxfoundation.org/meeting/97317265591?password=abc';

describe('lfxInviteUrl', () => {
  it('appends invite=true to LFX meeting URLs', () => {
    const result = lfxInviteUrl(LFX);
    expect(result).toContain('invite=true');
    expect(result).toContain('password=abc');
  });

  it('does not duplicate invite=true', () => {
    const once = lfxInviteUrl(LFX);
    const twice = lfxInviteUrl(once);
    expect(twice).toBe(once);
  });

  it('returns null for non-LFX URLs', () => {
    expect(lfxInviteUrl('https://example.com/meeting')).toBeNull();
    expect(lfxInviteUrl('')).toBeNull();
    expect(lfxInviteUrl(null)).toBeNull();
  });
});

describe('eventInviteUrl', () => {
  it('prefers event.url', () => {
    expect(
      eventInviteUrl({
        url: LFX,
        extendedProps: { location: 'https://example.com' },
      })
    ).toContain('invite=true');
  });

  it('falls back to location', () => {
    expect(
      eventInviteUrl({
        url: '',
        location: LFX,
      })
    ).toContain('invite=true');
  });

  it('returns null for custom events without LFX links', () => {
    expect(
      eventInviteUrl({
        title: 'Town hall',
        extendedProps: { location: 'New York' },
      })
    ).toBeNull();
  });
});
