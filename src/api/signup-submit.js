import { google } from 'googleapis';
import { readFileSync } from 'fs';

function checkPromiseState(promise) {
  return promise
    .then(() => "fulfilled")
    .catch(() => "rejected");
}


async function updateAttendees(api, calendarId, eventId, newAttendees) {
  console.log(`Adding attendees to `, eventId, newAttendees, new Date().toISOString())

  const response = await api.events.patch({
    calendarId: calendarId,
    eventId: eventId,
    resource: {
      attendees: newAttendees
    },
    sendUpdates: 'externalOnly'
  })

  console.log(`Response from patch:`, response)

  if (response.status !== 200) {
    console.error(`Failed to update event ${eventId}`);
    throw new Error(`Error: ${response.status} ${response.statusText}`);
  } else {
    return 'ok';
  }
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
    return await updateAttendees(api, calendarId, eventId, newAttendees)
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

  return await addAttendeeToEvent(api, calendarId, masterEvent, email, true)
}

export default async function handler(req, res) {

  /**
   * After 10 seconds we return a response to the user
   */
  const timeout = 10000;

  const TIMEOUT_OCCURRED = 'TIMEOUT'

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

  const timeoutPromise = new Promise((resolve) => {
    setTimeout(() => { resolve(TIMEOUT_OCCURRED) }, timeout)
  });

  const updatePromises = individualEvents.map(async (e) => await updateEventRequest(api, calendarId, e, req.body.email))

  Promise.race([
    Promise.allSettled(updatePromises),
    timeoutPromise
  ]).then((results) => {

    console.log(`Results at time of return: |${results}|`)
    console.log("UpdatePromises at time of return: ", updatePromises)

    if (results === TIMEOUT_OCCURRED) {
      res.json(`Timeout reached,  However, you should still receive your invite. Please check your inbox.\nEvent ID: ${req.body.eventId}\nEmail: ${req.body.email}`);
      return

    } else {
      const failedUpdates = results.filter(result => result.status === "rejected");
      const errorDetails = JSON.stringify(failedUpdates)

      if (failedUpdates.length > 0) {
        res.json(`${failedUpdates.length} updates failed:` + errorDetails);
      } else {
        res.json(`success`);
      }
    }
  })


}