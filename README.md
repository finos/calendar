# FINOS Calendar

This app powers [calendar.finos.org](https://calendar.finos.org), which is also embedded on [finos.org/calendar](https://www.finos.org/calendar). It overlays two **live ICS feeds**:

- **LFX meetings** from the Linux Foundation LFX calendar Worker
- **Custom events** from the writable FINOS Google Calendar (`finos.org_fac8mo1rfc6ehscg0d80fi8jig@group.calendar.google.com`)

The page fetches those feeds at runtime through same-origin proxies (`/feeds/lfx.ics` and `/feeds/custom.ics`). A merged subscribe feed is available at [`/calendar.ics`](/calendar.ics). Feeds only include events from the past month through the next 18 months.

## Adding events

- Recurring LFX project meetings belong in [LFX Project Control Center](https://projectadmin.lfx.linuxfoundation.org/).
- Events LFX cannot represent yet go on the **old FINOS Google Calendar only**. Do not add LFX meetings there, or they will appear twice. The Google **import** calendar (`@import.calendar.google.com`) is read-only and is not used by this app.
- To feature a custom event, put `[highlight]` in its Google Calendar title (for example `[highlight] FINOS Summit`). It appears at the top of that day, bolded, under the **Events** tab.

## Prerequisites

- Node.js 20+

## Getting started

```bash
git clone https://github.com/finos/calendar.git
cd calendar
cp .env.example .env
```

Set `LFX_ICS_URL` in `.env` to the LFX Worker URL including the token. Optionally override `GOOGLE_CUSTOM_ICS_URL` (it defaults to the public ICS of the writable FINOS Google Calendar).

```bash
npm install
npm start
```

Open [http://localhost:5173/](http://localhost:5173/).

### Production env vars (Netlify)

| Name | Required | Purpose |
| --- | --- | --- |
| `LFX_ICS_URL` | yes | Full LFX Worker ICS URL, including `?token=` |
| `GOOGLE_CUSTOM_ICS_URL` | no | Public Google Calendar `basic.ics` for custom events |

Do not commit the LFX token. It is only used server-side by the ICS proxy.

### Scripts

```bash
npm start      # Vite dev server (proxies ICS feeds)
npm test       # Vitest
npm run build  # Vite production build
npm run lint   # ESLint
```

## Subscribe / embed

- Live combined ICS: `https://calendar.finos.org/calendar.ics`
- The site may be framed by `https://www.finos.org` and `https://finos.org` (`Content-Security-Policy: frame-ancestors`).

Clicking **Invite Me** on an LFX meeting opens the Zoom LFX registration page (`invite=true`). Custom Google events do not have that flow; use **Event ICS** or the event location instead.

## Tests

```bash
npm test
```
