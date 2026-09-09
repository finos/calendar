import { describe, expect, it } from 'vitest';

import { isHighlightedEvent, parseHighlightTitle } from './event-highlight.js';

describe('parseHighlightTitle', () => {
  it('detects [highlight] and strips it from the title', () => {
    expect(parseHighlightTitle('[highlight] FINOS Summit')).toEqual({
      title: 'FINOS Summit',
      highlighted: true,
    });
  });

  it('is case-insensitive and tolerates spaces inside the tag', () => {
    expect(parseHighlightTitle('Town Hall [ Highlight ]')).toEqual({
      title: 'Town Hall',
      highlighted: true,
    });
  });

  it('leaves normal titles alone', () => {
    expect(parseHighlightTitle('Regular meeting')).toEqual({
      title: 'Regular meeting',
      highlighted: false,
    });
  });
});

describe('isHighlightedEvent', () => {
  it('reads the highlighted flag from extendedProps', () => {
    expect(
      isHighlightedEvent({ extendedProps: { highlighted: true } })
    ).toBe(true);
    expect(isHighlightedEvent({ extendedProps: {} })).toBe(false);
  });
});
