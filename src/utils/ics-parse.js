import ICAL from 'ical.js';

function propertyValue(vevent, name) {
  return vevent.getFirstPropertyValue(name) || '';
}

function toEventRecord(event, vevent, start, end) {
  return {
    uid: event.uid,
    title: event.summary || 'Untitled',
    start,
    end,
    description: event.description || '',
    location: event.location || '',
    url: String(propertyValue(vevent, 'url') || ''),
  };
}

export function parseIcsEvents(icsText, rangeStart, rangeEnd) {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const events = [];

  for (const vevent of comp.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(vevent);

    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next;
      while ((next = iterator.next())) {
        const start = next.toJSDate();
        if (start > rangeEnd) break;
        if (start < rangeStart) continue;
        const occ = event.getOccurrenceDetails(next);
        events.push(
          toEventRecord(
            event,
            vevent,
            occ.startDate.toJSDate(),
            occ.endDate.toJSDate()
          )
        );
      }
    } else {
      const start = event.startDate.toJSDate();
      if (start >= rangeStart && start <= rangeEnd) {
        events.push(
          toEventRecord(
            event,
            vevent,
            start,
            event.endDate.toJSDate()
          )
        );
      }
    }
  }

  return events.sort((a, b) => a.start - b.start);
}
