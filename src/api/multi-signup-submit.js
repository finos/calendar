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
    const timeout = 10000;
    const TIMEOUT_OCCURRED = 'TIMEOUT'

    console.log(`submitted form`, req.body, __filename)

    const calendarId = 'finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com';
    const eventIds = req.body.eventIds;

    if (!eventIds || eventIds.length === 0) {
        res.status(400).json('No events selected');
        return;
    }

    const CREDENTIALS = process.env.GOOGLE_SERVICE_ACCOUNT ?
        JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT) :
        JSON.parse(readFileSync('./calendar-service-account.json'))

    const SCOPES = [
        'https://www.googleapis.com/auth/calendar'
    ];

    const auth = new google.auth.GoogleAuth({
        credentials: CREDENTIALS,
        scopes: SCOPES,
        clientOptions: {
            subject: 'rob.moffat@finos.org',
        },
    });

    const api = google.calendar({ version: 'v3', auth: await auth.getClient() });

    const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => { resolve(TIMEOUT_OCCURRED) }, timeout)
    });

    const updatePromises = eventIds.map(async (eventId) =>
        await updateEventRequest(api, calendarId, eventId, req.body.email)
    );

    Promise.race([
        Promise.allSettled(updatePromises),
        timeoutPromise
    ]).then((results) => {
        console.log(`Results at time of return: |${results}|`)
        console.log("UpdatePromises at time of return: ", updatePromises)

        if (results === TIMEOUT_OCCURRED) {
            res.json(`Timeout reached. However, you should still receive your invites. Please check your inbox.\nEvent IDs: ${eventIds.join(', ')}\nEmail: ${req.body.email}`);
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