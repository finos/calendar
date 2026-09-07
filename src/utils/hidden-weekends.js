export function sameHiddenDays(a, b) {
  return a.length === b.length && a.every((day, index) => day === b[index]);
}

export function hiddenWeekendDays(ranges, viewStart, viewEnd) {
  let hasSaturday = false;
  let hasSunday = false;
  const viewStartMs = +viewStart;
  const viewEndMs = +viewEnd;

  for (const range of ranges) {
    if (!range?.start) continue;
    const start = Math.max(+range.start, viewStartMs);
    const end = Math.min(+(range.end || range.start), viewEndMs);
    if (!(end > start)) continue;

    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    while (cursor.getTime() < end && !(hasSaturday && hasSunday)) {
      const day = cursor.getDay();
      if (day === 6) hasSaturday = true;
      if (day === 0) hasSunday = true;
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const hidden = [];
  if (!hasSunday) hidden.push(0);
  if (!hasSaturday) hidden.push(6);
  return hidden;
}

export function eventRangesFromCalendar(api) {
  const instances = api.getCurrentData?.()?.eventStore?.instances;
  if (instances) {
    return Object.values(instances).map((instance) => ({
      start: instance.range.start,
      end: instance.range.end,
    }));
  }

  return api.getEvents().map((event) => ({
    start: event.start,
    end: event.end || event.start,
  }));
}
