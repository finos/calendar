import { google } from 'googleapis';
import { convert } from 'html-to-text';
import ical, { ICalCalendarMethod } from 'ical-generator';
import fs from 'fs';

// The FINOS Community Calendar ID
const calendarId =
  'finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com';

const outputFile = './dist/events.json';

// Replace with the path to your service account JSON file
const SERVICE_ACCOUNT_FILE = './calendar-service-account.json';

// Scopes required for the Google Calendar API
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.events.readonly',
  'https://www.googleapis.com/auth/calendar.readonly',
];

// Create a JWT client using the service account key
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: SCOPES,
});

// Create a Calendar API client
const calendar = google.calendar({ version: 'v3', auth });

// Used to divide API requests in 2: past and future,
// to avoid the 2500 events limit
// This can be easily improved (TODO)
const cutoffDate = '2024-01-01T00:00:00Z';
const limitFutureDate = '2026-01-01T00:00:00Z';

// We collect the unique root recurring events
// to generate the correct ICS (iCal) format
let rootRecurringEventsICS = new Map();

function saveToFile(filepath, str) {
  fs.writeFileSync(filepath, str);
}

function saveJSONToFile(filepath, items) {
  const itemsJson = JSON.stringify(items, null, 2);
  saveToFile(filepath, itemsJson);
}

// Check if an event has valid recurrence data
function hasRecurrence(eventData) {
  return eventData.recurrence && !eventData.recurrence[0].startsWith('EXDATE');
}

// Resolve recurrence data from the
// root event (recurringEventId)
function addRecurrence(eventData, events, icsEvent) {
  const repeating = getRecurrence(eventData, events);
  if (repeating) {
    icsEvent.repeating = repeating;
  }
}
function getRecurrence(eventData, events) {
  let repeating = null;
  if (hasRecurrence(eventData)) {
    repeating = eventData.recurrence[0];
  } else if (eventData.recurringEventId) {
    const rootEvent = events.get(eventData.recurringEventId);
    if (rootEvent && hasRecurrence(rootEvent)) {
      repeating = rootEvent.recurrence[0];
    }
  }
  return repeating;
}

function saveRootRecurringEvent(eventData, icsEvent) {
  const rootId = eventData.id.split('_')[0];
  const rootEventICS = {
    eventData,
    icsEvent,
  };

  if (rootRecurringEventsICS.has(rootId)) {
    rootRecurringEventsICS.get(rootId).push(rootEventICS);
  } else {
    rootRecurringEventsICS.set(rootId, [rootEventICS]);
  }
}

// Returns a string with the ICS format of the event
// Includes HTML to text conversion, and recurrence data
function addICS(fcEvent, eventData, events) {
  const calendar = ical({ name: eventData.summary });
  // ICalCalendarMethod is required by outlook
  // to display events as invitations
  calendar.method(ICalCalendarMethod.REQUEST);

  // Convert HTML to text, and wrap text
  // to 130 characters
  const options = {
    wordwrap: 130,
    selectors: [
      {
        selector: 'a',
        options: {
          hideLinkHrefIfSameAsText: true,
        },
      },
    ],
  };

  let icsEvent = {
    start: eventData.start.dateTime,
    end: eventData.end.dateTime,
    summary: eventData.summary,
    description: convert(eventData.description, options),
  };
  addRecurrence(eventData, events, icsEvent);
  calendar.createEvent(icsEvent);
  fcEvent.ics = calendar.toString();

  if (icsEvent.repeating) {
    // Remove the UNTIL field from the rrule
    fcEvent.ics = fcEvent.ics.replace(/UNTIL=.*;/, '');
    saveRootRecurringEvent(eventData, fcEvent.ics);
    fcEvent.rootIcsLink = eventData.id.split('_')[0] + '.ics';
  }
  return fcEvent;
}

// Adds static options for Google API calls
function getApiOptions(options) {
  options.set('maxResults', 2500);
  options.set('calendarId', calendarId);
  return Object.fromEntries(options);
}

// Returns the events from the Google Calendar API
// If results hit the limit of 2500 entries, an error is thrown
// Accepts additional options to pass to the API
async function getGoogleEvents(queryName, dynamicOptions) {
	let allItems = [];
	let nextPageToken = null;

	do {
		if (nextPageToken) {
			dynamicOptions.set('pageToken', nextPageToken);
		}

		const itemsAsync = await calendar.events.list(getApiOptions(dynamicOptions));
		const items = itemsAsync.data.items;
		allItems = allItems.concat(items);
		nextPageToken = itemsAsync.data.nextPageToken;
	} while (nextPageToken);

	if (allItems.length == 0) {
		throw new Error(queryName + ' No events returned!');
	} else {
		console.log(queryName + ' Events retrieved:', allItems.length);
	}
	return allItems;
}

// Fetches events from Google API and transforms them
// into FullCalendar events, generating a events.json file
// The events are fetched in 2 batches, to avoid the
// 2500 events limit.
// Another API call is made to fetch recurring events,
// which are used to generate the correct ICS (iCal) format
async function parseGoogleEvents() {
  // Fetch events before the cutoff date
  const eventsPast = await getGoogleEvents(
    'Past Cutoff',
    new Map([
      ['singleEvents', true],
      ['timeMax', cutoffDate],
    ])
  );
  // Fetch events after the cutoff date
  const eventsFuture = await getGoogleEvents(
    'Future Cutoff',
    new Map([
      ['singleEvents', true],
      ['timeMin', cutoffDate],
      ['timeMax', limitFutureDate],
    ])
  );

  // Fetch all events, including recurring ones
  // These events are used for resolving the recurrence of events
  // They are not used for rendering the events in the calendar
  const recurringEvents = await getGoogleEvents(
    'Recurring',
    new Map([['singleEvents', false]])
  );
  const recurringEventsMap = new Map();
  for (const eventData of recurringEvents) {
    recurringEventsMap.set(eventData.id, eventData);
  }

  // Merge past and future events, to generate
  // the FullCalendar events JSON
  const eventItems = eventsPast.concat(eventsFuture);
  console.log('Events fetched:', eventItems.length);

  // Map events to a simplified array of event data
  const mappedEvents = mapEvents(eventItems, recurringEventsMap);
  console.log('Events returned:', mappedEvents.length);

  // Save events to the output file
  saveJSONToFile(outputFile, mappedEvents);
}

function hasAcceptedEvent(eventData) {
  if (eventData.attendees) {
    for (const attendee of eventData.attendees) {
      if (attendee.email == calendarId) {
        return attendee.responseStatus == 'accepted';
      }
    }
  }
  return true;
}

// Maps Google API events to FullCalendar events
// Generates and attaches the ICS format of the event
function mapEvents(events, recurringEventsMap) {
  let eventsProcessed = [];
  let eventsNotProcessed = [];
  const ret = events
    .map((eventData) => {
      if (eventData.status === 'confirmed' && hasAcceptedEvent(eventData)) {
        let eventKey =
          eventData.start.dateTime + '_' + eventData.id.split('_')[0];
        if (!eventsProcessed.includes(eventKey)) {
          eventsProcessed.push(eventKey);
          let fcEvent = {
            title: eventData.summary,
            description: eventData.description,
            start: eventData.start.dateTime,
            end: eventData.end.dateTime,
            uid: eventData.id,
            location: eventData.location,
            repeating: getRecurrence(eventData, recurringEventsMap),
          };
          fcEvent = addICS(fcEvent, eventData, recurringEventsMap);
          return fcEvent;
        }
      } else {
        eventsNotProcessed.push(eventData);
        return null;
      }
    })
    .filter(Boolean); // Remove null values
  console.log('Events not processed:', eventsNotProcessed.length);
  return ret;
}

async function main() {
  try {
    await parseGoogleEvents();
    console.log('All events retrieved from Google Calendar API!');
    console.log('Saving ICS files:', rootRecurringEventsICS.size);
    for (const [eventId, eventsICS] of rootRecurringEventsICS) {
      const sortedEventsICS = eventsICS.sort((a, b) => {
        return a.eventData.start.dateTime > b.eventData.start.dateTime;
      });
      saveToFile('./dist/' + eventId + '.ics', sortedEventsICS[0].icsEvent);
    }
  } catch (error) {
    console.error('Error occurred:', error);
  }
}

main();
