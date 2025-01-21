import { google } from 'googleapis';

export default async function handler(req, res) {
  console.log(`submitted form`, req.body, __filename)

  const calendarId =
    'finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com';

  const eventId = req.body.eventId;

  // Replace with the path to your service account JSON file
  const SERVICE_ACCOUNT_FILE = process.env.SERVICE_ACCOUNT_FILE ?? './calendar-service-account.json'

  // Scopes required for the Google Calendar API
  const SCOPES = [
    'https://www.googleapis.com/auth/calendar'
  ];

  // Create a JWT client using the service account key
  const auth = new google.auth.GoogleAuth({
    keyFile: SERVICE_ACCOUNT_FILE,
    scopes: SCOPES,
    clientOptions: {
      subject: 'rob.moffat@finos.org', // Specify the user to impersonate
    },
  });

  //const client = auth.getClient()

  // Create a Calendar API client
  const calendar = google.calendar({ version: 'v3', auth });

  const event = (await calendar.events.get({
    calendarId: calendarId,
    eventId: eventId,
  })).data


  console.log(`event`, event)

  const existingAttendees = event.attendees ?? []

  const done = await calendar.events.patch({
    calendarId: calendarId,
    eventId: eventId,
    resource: {
      attendees: [
        ...existingAttendees,
        {
          email: req.body.email,
        },
      ]
    }
  })

  res.json(`ok bebob ${JSON.stringify("hello")}`)
}