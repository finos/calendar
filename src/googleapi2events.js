import { google } from 'googleapis';
import fs from 'fs';

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

export const allEvents = [];

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
			// Map events to a simplified array of event data
			const mappedEvents = mapEvents(events.data.items);

			// Save the events to a file
			saveEventsToFile(mappedEvents);
			allEvents.push(...mappedEvents);
		}
		else {
			console.log('No events found.');
		}
	} catch (error) {
		console.error('Error retrieving calendar events:', error);
		throw error; // Rethrow the error to be handled by the caller
	}
}

const eventsFilePath = './dist/events.json';

function saveEventsToFile(events) {
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

let eventsProcessed = [];

// Function to map events to a simplified array of event data
function mapEvents(events) {
	return events
		.map((eventData) => {
			// console.log(eventData);
			if (eventData.status === 'confirmed') {
				let eventKey = eventData.start.dateTime + '_' + eventData.id.split('_')[0];
				if (!eventsProcessed.includes(eventKey)) {
					eventsProcessed.push(eventKey);
					return {
						title       : eventData.summary ? eventData.summary : null,
						description : eventData.description,
						start       : eventData.start.dateTime,
						end         : eventData.end.dateTime,
						uid         : eventData.id
					};
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
