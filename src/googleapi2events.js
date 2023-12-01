import { google } from 'googleapis';
import fs from 'fs';
import ical from 'ical-generator';

// Replace with the path to your service account JSON file
const SERVICE_ACCOUNT_FILE = './calendar-service-account.json';

// Scopes required for the Google Calendar API
const SCOPES = [
	'https://www.googleapis.com/auth/calendar',
	'https://www.googleapis.com/auth/calendar.events',
	'https://www.googleapis.com/auth/calendar.events.readonly',
	'https://www.googleapis.com/auth/calendar.readonly'
];

// Create a JWT client using the service account key
const auth = new google.auth.GoogleAuth({
	keyFile : SERVICE_ACCOUNT_FILE,
	scopes  : SCOPES
});

// export const allEvents = [];

// Function to retrieve events and return a promise
async function listEvents() {
	try {
		// Create a Calendar API client
		const calendar = google.calendar({ version: 'v3', auth });

		// Example usage: Get the ID of an existing calendar
		const calendarId = 'finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com';

		const maxResults = 2500;

		const singleEvents = false;

		const timeMin = '2021-01-01T00:00:00Z';

		const events = await calendar.events.list({
			calendarId,
			maxResults,
			singleEvents,
			timeMin
		});

		if (events.data.items && events.data.items.length > 0) {
			const eventsMap = new Map();
			for (const eventData of events.data.items) {
				eventsMap.set(eventData.id, eventData)
			}

			// Map events to a simplified array of event data
			const mappedEvents = mapEvents(eventsMap);

			// Save the events to a file
			saveEventsToFile(mappedEvents);
			// allEvents.push(...mappedEvents);
		}
		else {
			console.log('No events found.');
		}
	} catch (error) {
		console.error('Error retrieving calendar events:', error);
		throw error; // Rethrow the error to be handled by the caller
	}
}

function saveEventsToFile(events) {
	const eventsFilePath = './dist/events.json';
	try {
		// Convert events array to JSON string
		const eventsJson = JSON.stringify(events, null, 2);

		// Write the JSON string to the file
		fs.writeFileSync(eventsFilePath, eventsJson);

		console.log('Events saved to file:', eventsFilePath);
	} catch (error) {
		console.error('Error saving events to file:', error);
		throw error; // Rethrow the error to be handled by the caller
	}
}

function hasRecurrence(eventData) {
	return eventData.recurrence &&
		!eventData.recurrence[0].startsWith('EXDATE');
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

function addICS(fcEvent, eventData, events) {
	const calendar = ical({name: eventData.summary});
	// A method is required for outlook to display event as an invitation
	// calendar.method(ICalCalendarMethod.REQUEST);
	let icsEvent = {
		start: eventData.start.dateTime,
		end: eventData.end.dateTime,
		summary: eventData.summary,
		description: eventData.description
	}

	const repeating = getRecurrence(eventData, events);
	if (repeating) {
		icsEvent.repeating = repeating;
	}

	// For debugging purposes
	// if (eventData.start &&
	// 	eventData.start.dateTime &&
	// 	eventData.start.dateTime.startsWith("2023-12-05")) {
	// 	console.log(eventData);
	// 	console.log(icsEvent);
	// }

	calendar.createEvent(icsEvent);
	fcEvent.ics = calendar.toString()
	return fcEvent;
}

// Function to map events to a simplified array of event data
function mapEvents(events) {
	let eventsProcessed = [];
	return Array.from(events.values()).flat()
		.map((eventData) => {
			if (eventData.status === 'confirmed') {
				let eventKey = eventData.start.dateTime + '_' + eventData.id.split('_')[0];
				if (!eventsProcessed.includes(eventKey)) {
					eventsProcessed.push(eventKey);
					let fcEvent = {
						title       : eventData.summary ? eventData.summary : null,
						description : eventData.description,
						start       : eventData.start.dateTime,
						end         : eventData.end.dateTime,
						uid         : eventData.id,
						repeating   : getRecurrence(eventData, events)
					};
					fcEvent = addICS(fcEvent, eventData, events);
					return fcEvent;
				}
			}
		})
		.filter(Boolean);
}

// Main function to initiate the events retrieval
async function main() {
	try {
		await listEvents(); // Wait for the listEvents() function to finish
		console.log('All events retrieved');
		// Any code that depends on the events should be placed here
	} catch (error) {
		// Handle errors
		console.error('Error occurred:', error);
	}
}

main(); // Call the main function to start the events retrieval process
