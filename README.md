\*\*\*\*# FINOS Calendar

This code builds the page hosted on https://calendar.finos.org , which is also embedded on https://www.finos.org/calendar , in order to provide a fully hosted solution that shows all events in the [FINOS Community (Google) Calendar](https://calendar.google.com/calendar/embed?src=symphony.foundation_6g70j7s80813djmj9q7gmgdjuc%40group.calendar.google.com&ctz=Europe%2FMadrid) that can be correctly visualised also behind a corporate firewall.

A Github action runs periodically to fetch events using Google APIs (see [src/googleapi2events.js](src/googleapi2events.js)) and renders out a JSON file in `dist/events.json`.

The calendar is visualized in HTML using React and [FullCalendar](https://fullcalendar.io/).

## Prerequisites

- Node.js, npm and GPG(/GNUPG) installed on your machine.

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/finos/calendar.git
cd calendar
```

2. Download `calendar-service-account.json` into the project's root folder.

In order to use the Google Calendar API you will need to follow [these 5 steps](https://developers.google.com/workspace/guides/get-started) to generate the necessary credentials for a Service Account. Once you have the credentials store them in the root folder of the project in a file named `calendar-service-account.json`.

### Encrypting Google Service Account key

```
gpg --symmetric --cipher-algo AES256 calendar-service-account.json
```

### Install the dependencies:

```bash
npm install
```

### Import events from Google API

Create a new directory named `dist` in the root directory and run :

```bash
npm run get-events
```

Copy `events.json` from `dist` to root directory.

### Run development server

```bash
npm start
```

Open browser to `http://localhost:5173/`.

### Live environment

https://calendar.finos.org is served by Github Pages and deployed by the [build.yml](.github/workflows/build.yml) Github Action.

### Tests

Tests are implemented using [testing-library/react](https://testing-library.com/docs/react-testing-library/intro) and [vitest](https://vitest.dev/).

```bash
npm run test
```
