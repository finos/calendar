const POPUP_WIDTH = 400;
const POPUP_ESTIMATED_HEIGHT = 420;
const MARGIN = 16;

export function popupPositionFromRect(rect, viewport, scroll) {
  const viewW = viewport.width;
  const viewH = viewport.height;
  let left = rect.right + 12 + scroll.x;
  let top = rect.top + scroll.y;

  if (rect.right + 12 + POPUP_WIDTH > viewW - MARGIN) {
    left = rect.left + scroll.x - POPUP_WIDTH - 12;
  }
  if (left < scroll.x + MARGIN) {
    left = scroll.x + MARGIN;
  }
  if (left + POPUP_WIDTH > scroll.x + viewW - MARGIN) {
    left = scroll.x + viewW - POPUP_WIDTH - MARGIN;
  }

  if (rect.top + POPUP_ESTIMATED_HEIGHT > viewH - MARGIN) {
    top = scroll.y + viewH - POPUP_ESTIMATED_HEIGHT - MARGIN;
  }
  if (top < scroll.y + MARGIN) {
    top = scroll.y + MARGIN;
  }

  return { left: `${Math.round(left)}px`, top: `${Math.round(top)}px` };
}

export function popupPositionFromClick(jsEvent) {
  const el = jsEvent.target?.closest?.('a.fc-event');
  if (el) {
    return popupPositionFromRect(
      el.getBoundingClientRect(),
      { width: window.innerWidth, height: window.innerHeight },
      { x: window.scrollX, y: window.scrollY }
    );
  }
  return popupPositionFromRect(
    { left: jsEvent.clientX, right: jsEvent.clientX, top: jsEvent.clientY, bottom: jsEvent.clientY },
    { width: window.innerWidth, height: window.innerHeight },
    { x: window.scrollX, y: window.scrollY }
  );
}
