import ICAL from 'ical.js';

function propertyValue(vevent, name) {
  return vevent.getFirstPropertyValue(name) || '';
}

export function registerIcsTimezones(comp) {
  for (const tzComp of comp.getAllSubcomponents('vtimezone')) {
    const tzid = tzComp.getFirstPropertyValue('tzid');
    if (!tzid || ICAL.TimezoneService.has(tzid)) continue;
    ICAL.TimezoneService.register(tzComp);
  }
}

function formatAllDayDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toEventRecord(event, vevent, start, end, allDay) {
  return {
    uid: event.uid,
    title: event.summary || 'Untitled',
    start,
    end,
    allDay,
    description: event.description || '',
    location: event.location || '',
    url: String(propertyValue(vevent, 'url') || ''),
  };
}

export function parseIcsEvents(icsText, rangeStart, rangeEnd) {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  registerIcsTimezones(comp);
  const events = [];

  for (const vevent of comp.getAllSubcomponents('vevent')) {
    const event = new ICAL.Event(vevent);
    const allDay = Boolean(event.startDate?.isDate);

    if (event.isRecurring()) {
      const iterator = event.iterator();
      let next;
      let iterations = 0;
      while ((next = iterator.next())) {
        iterations += 1;
        if (iterations > 1000) break;
        const start = next.toJSDate();
        if (start > rangeEnd) break;
        if (start < rangeStart) continue;
        const occ = event.getOccurrenceDetails(next);
        events.push(
          toEventRecord(
            event,
            vevent,
            occ.startDate.toJSDate(),
            occ.endDate.toJSDate(),
            allDay
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
            event.endDate.toJSDate(),
            allDay
          )
        );
      }
    }
  }

  return events.sort((a, b) => a.start - b.start);
}

/** FullCalendar event inputs with absolute UTC instants (local display via timeZone). */
export function parseIcsFullCalendarEvents(icsText, rangeStart, rangeEnd) {
  return parseIcsEvents(icsText, rangeStart, rangeEnd).map((event) => {
    const start = event.allDay
      ? formatAllDayDate(event.start)
      : event.start.toISOString();
    const end = event.end
      ? event.allDay
        ? formatAllDayDate(event.end)
        : event.end.toISOString()
      : null;

    return {
      id: `${event.uid}-${start}`,
      title: event.title,
      start,
      end,
      allDay: event.allDay,
      url: event.url || undefined,
      extendedProps: {
        location: event.location,
        description: event.description,
      },
    };
  });
}

export function createIcsEventSource(url) {
  return (fetchInfo, successCallback, failureCallback) => {
    const rangeStart = new Date(fetchInfo.start);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
    const rangeEnd = new Date(fetchInfo.end);
    rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 1);

    fetch(url)
      .then(async (response) => {
        if (!response.ok) {
          const error = new Error(`ICS fetch failed ${response.status}`);
          error.url = url;
          throw error;
        }
        const icsText = await response.text();
        successCallback(
          parseIcsFullCalendarEvents(icsText, rangeStart, rangeEnd)
        );
      })
      .catch(failureCallback);
  };
}
