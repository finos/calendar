import { google } from 'googleapis';
import { readFileSync } from 'fs';

async function updateAttendees(api, calendarId, eventId, newAttendees) {
  console.log(`Adding attendees to `, eventId, newAttendees)

  await api.events.patch({
    calendarId: calendarId,
    eventId: eventId,
    resource: {
      attendees: newAttendees
    },
    sendUpdates: 'externalOnly'
  })

}

async function addAttendeeToEvent(api, calendarId, event, email, addForReal) {

  console.log(`Adding attendee to `, event.id, event.start, event.summary, addForReal)

  const newAttendees = [
    ...event.attendees,
    {
      email: email,
    },
  ]
  const eventId = event.id

  if (addForReal) {
    return updateAttendees(api, calendarId, eventId, newAttendees)
  }
}

async function updateEventRequest(api, calendarId, eventId, email) {
  const event = (await api.events.get({
    calendarId: calendarId,
    eventId: eventId,
  })).data

  console.log(`Original Event:`, event)

  const masterEventId = event.recurringEventId ? event.recurringEventId : event.id

  console.log(`Master Event ID:`, masterEventId)

  // update the series
  const masterEvent = (masterEventId != eventId) ? (await api.events.get({
    calendarId: calendarId,
    eventId: masterEventId,
  })).data : event

  console.log(`Master Event:`, masterEvent)

  await addAttendeeToEvent(api, calendarId, masterEvent, email, true)
}

export default async function handler(req, res) {
  console.log(`submitted form`, req.body, __filename)

  const calendarId =
    'finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com';

  const eventId = req.body.eventId;

  const CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT ?
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT) :
    JSON.parse(readFileSync('./calendar-service-account.json'))

  // Scopes required for the Google Calendar API
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar'
  ];

  // Create a JWT client using the service account key
  const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: SCOPES,
    clientOptions: {
      subject: 'rob.moffat@finos.org', // Specify the user to impersonate
    },
  });

  // Create a Calendar API client
  const api = google.calendar({ version: 'v3', auth: await auth.getClient() });

  const individualEvents = eventId.split(',')

  try {
    for (const individualEventId of individualEvents) {
      await updateEventRequest(api, calendarId, individualEventId, req.body.email)
    }

    res.json(`success`)
  } catch (err) {
    res.json(`Error updating calendar: ${err}`)
  }
}