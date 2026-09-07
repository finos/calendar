import { describe, expect, it } from 'vitest';

import { popupPositionFromRect } from './popup-position.js';

describe('popupPositionFromRect', () => {
  it('opens to the right of the event when there is room', () => {
    const pos = popupPositionFromRect(
      { left: 80, right: 200, top: 120, bottom: 140 },
      { width: 1200, height: 800 },
      { x: 0, y: 0 }
    );
    expect(pos.left).toBe('212px');
    expect(pos.top).toBe('120px');
  });

  it('flips to the left when the popup would overflow the viewport', () => {
    const pos = popupPositionFromRect(
      { left: 900, right: 1100, top: 100, bottom: 120 },
      { width: 1200, height: 800 },
      { x: 0, y: 0 }
    );
    expect(parseInt(pos.left, 10)).toBeLessThan(900);
  });
});
