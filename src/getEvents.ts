import { calendar_v3, google } from 'googleapis';
import fs from 'fs';

// Replace with the path to your service account JSON file
const SERVICE_ACCOUNT_FILE = './calendar-service-account.json';

// Scopes required for the Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];

// Create a JWT client using the service account key
const auth = new google.auth.GoogleAuth({
  keyFile: SERVICE_ACCOUNT_FILE,
  scopes: SCOPES,
});

export let allEvents: calendar_v3.Schema$Event[] = [];

async function listEvents() {
  try {
    // Create a Calendar API client
    const calendar = google.calendar({ version: 'v3', auth });

    // Example usage: Get the ID of an existing calendar
    const calendarId = "finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com"
    
    const events = await calendar.events.list({ calendarId });
    
    if (events.data.items && events.data.items.length > 0) {
      // Save events to the allEvents variable
      allEvents = events.data.items;
      
      // Save the events to a file
      saveEventsToFile(allEvents);
    } else {
      console.log('No events found.');
    }
  } catch (error) {
    console.error('Error retrieving calendar events:', error);
  }
}

const eventsFilePath = './events.json';

function saveEventsToFile(events: calendar_v3.Schema$Event[]) {
  try {
    // Convert events array to JSON string
    const eventsJson = JSON.stringify(events, null, 2);

    // Write the JSON string to the file
    fs.writeFileSync(eventsFilePath, eventsJson);

    console.log('Events saved to file:', eventsFilePath);
  } catch (error) {
    console.error('Error saving events to file:', error);
  }
}
        // Print event details
        // if (events.data.items && events.data.items.length > 0) {
        //     console.log(`Events in the existing calendar:`);
        //     events.data.items.forEach((event) => {
        //     console.log(`Event summary: ${event.summary}, Start time: ${event.start?.dateTime}, End time: ${event.end?.dateTime}`);
        //     });
        // } else {
        //     console.log('No events found.');
        // }

        // // Filter events from 2023 and onwards
        // const filteredEvents = events.data.items?.filter((event) => {
        //     const eventStartDate = new Date(event.start?.dateTime || event.start?.date || '');
        //     return eventStartDate >= new Date('2023-01-01');
        //     });
  
        // // Print event details
        // if (filteredEvents && filteredEvents.length > 0) {
        //     console.log(`Events in the existing calendar from 2023 onwards:`);
        //     filteredEvents.forEach((event) => {
        //     console.log(`Event summary: ${event.summary}, Start time: ${event.start?.dateTime}, End time: ${event.end?.dateTime}`);
        //     });
        // } else {
        //     console.log('No events found in 2023 or onwards.');
        // }
    

listEvents();
