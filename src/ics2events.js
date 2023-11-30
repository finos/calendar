const ical = require('node-ical');
const { DateTime } = require("luxon");
var fs = require('fs');

function generateIcs(event) {
    // TODO - use https://www.npmjs.com/package/ical-generator
    return "WIP";
}

console.log("Start ICS conversion to events.json");

const icsEvents = ical.sync.parseFile('dist/basic.ics');

filterAfterDate = DateTime.fromISO("2023-01-01T00:00:00")

// testDate = DateTime.fromFormat("2023-12-05T18:30:00.000Z", { zone: 'America/New_York' })
// console.log("test date...");
// console.log(testDate.toUTC());
// console.log("Got ICS events...");

let events = [];
for (const event of Object.values(icsEvents)) {
    // if (event.type == 'VEVENT' && event.start > filterAfterDate) {
    if (event.type == 'VEVENT') {
        calEvent = {
            "uid": event.uid,
            "title": event.summary,
            "description": event.description,
            "start": event.start.toISOString(),
            "end": event.end.toISOString(),
        }

        if (event.rrule != undefined) {
            // console.log(event.rrule.toString())
            rrule = event.rrule.toString().split("\n");
            timeVal = rrule[0].split(":")[1];
            // dtstart = event.rrule[1].toString().split("\n")[0];

            calEvent.rrule = "DTSTART:" + timeVal + "Z\n" + rrule[1];

            calEvent.ics = generateIcs(calEvent);
        }
        // console.log(calEvent);
        events.push(calEvent);
    }
};

var eventsJson = JSON.stringify(events);

fs.writeFile('dist/events.json', eventsJson, err => {
    if (err) {
      console.error(err);
    }});