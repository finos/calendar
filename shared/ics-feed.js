export const DEFAULT_GOOGLE_ICS_URL =
  'https://calendar.google.com/calendar/ical/finos.org_fac8mo1rfc6ehscg0d80fi8jig%40group.calendar.google.com/public/basic.ics';

export const ICS_CACHE_CONTROL = 'public, max-age=300';
export const ICS_CONTENT_TYPE = 'text/calendar; charset=utf-8';

const FETCH_HEADERS = {
  'User-Agent': 'FINOS-Calendar/1.0 (https://calendar.finos.org)',
  Accept: 'text/calendar, text/plain, */*',
};

export function unfoldIcs(ics) {
  return String(ics || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n[ \t]/g, '');
}

export function foldIcsText(ics) {
  return unfoldIcs(ics)
    .split('\n')
    .map((line) => {
      if (line.length <= 75) return line;
      const parts = [line.slice(0, 75)];
      let rest = line.slice(75);
      while (rest.length) {
        parts.push(' ' + rest.slice(0, 74));
        rest = rest.slice(74);
      }
      return parts.join('\r\n');
    })
    .join('\r\n');
}

export function extractIcsBlocks(ics, name) {
  const unfolded = unfoldIcs(ics);
  const re = new RegExp(`BEGIN:${name}\\n[\\s\\S]*?END:${name}`, 'gi');
  return unfolded.match(re) || [];
}

export function parseIcsDateMs(value) {
  const match = String(value || '').match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?/
  );
  if (!match) return null;
  return Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0),
    Number(match[6] || 0)
  );
}

export function veventInWindow(block, minMs, maxMs) {
  const startMatch = block.match(/^DTSTART(?:;[^:]*)?:([^\r\n]+)/m);
  const untilMatch = block.match(/UNTIL=(\d{8}(?:T\d{6}Z?)?)/);
  const hasRrule = /^RRULE:/m.test(block);
  const startMs = startMatch ? parseIcsDateMs(startMatch[1]) : null;
  const untilMs = untilMatch ? parseIcsDateMs(untilMatch[1]) : null;

  if (hasRrule) {
    if (untilMs != null && untilMs < minMs) return false;
    if (startMs != null && startMs > maxMs) return false;
    return true;
  }
  if (startMs == null) return true;
  return startMs >= minMs && startMs <= maxMs;
}

function calendarWindow(now, pastMonths, futureMonths) {
  const minMs = new Date(
    now.getFullYear(),
    now.getMonth() - pastMonths,
    now.getDate()
  ).getTime();
  const maxMs = new Date(
    now.getFullYear(),
    now.getMonth() + futureMonths,
    now.getDate()
  ).getTime();
  return { minMs, maxMs };
}

export function trimIcsToWindow(
  ics,
  now = new Date(),
  pastMonths = 1,
  futureMonths = 18
) {
  const { minMs, maxMs } = calendarWindow(now, pastMonths, futureMonths);
  const timezones = extractIcsBlocks(ics, 'VTIMEZONE');
  const events = extractIcsBlocks(ics, 'VEVENT').filter((event) =>
    veventInWindow(event, minMs, maxMs)
  );

  return foldIcsText(
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FINOS//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:FINOS Event Calendar',
      ...timezones,
      ...events,
      'END:VCALENDAR',
      '',
    ].join('\n')
  );
}

function isPlaceholderLfxUrl(url) {
  return !url || url.includes('YOUR_TOKEN');
}

function tzidFromVTimezone(block) {
  const match = block.match(/^TZID:(.+)$/m);
  return match ? match[1].trim() : block.slice(0, 80);
}

export function mergeIcsCalendars(
  calendars,
  calName = 'FINOS Event Calendar'
) {
  const timezones = new Map();
  const events = [];

  for (const ics of calendars) {
    if (!ics) continue;
    for (const tz of extractIcsBlocks(ics, 'VTIMEZONE')) {
      const id = tzidFromVTimezone(tz);
      if (!timezones.has(id)) timezones.set(id, tz);
    }
    for (const event of extractIcsBlocks(ics, 'VEVENT')) {
      events.push(event);
    }
  }

  return foldIcsText(
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//FINOS//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
      ...timezones.values(),
      ...events,
      'END:VCALENDAR',
      '',
    ].join('\n')
  );
}

export async function fetchIcs(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) {
    throw new Error(`ICS fetch failed ${res.status}`);
  }
  return res.text();
}

export function icsResponse(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type':
        status === 200 ? ICS_CONTENT_TYPE : 'text/plain; charset=utf-8',
      'Cache-Control': status === 200 ? ICS_CACHE_CONTROL : 'no-store',
    },
  });
}

export async function loadFeedBodies({ lfxUrl, googleUrl }) {
  const tasks = [
    lfxUrl
      ? fetchIcs(lfxUrl)
      : Promise.reject(new Error('LFX_ICS_URL is not set')),
    fetchIcs(googleUrl),
  ];
  const results = await Promise.allSettled(tasks);
  const bodies = [];
  const errors = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      bodies.push(result.value);
    } else {
      errors.push(result.reason);
    }
  }

  return { bodies, errors };
}

export async function handleIcsRequest(kind, env = {}) {
  const lfxUrl = env.LFX_ICS_URL;
  const googleUrl = env.GOOGLE_CUSTOM_ICS_URL || DEFAULT_GOOGLE_ICS_URL;

  try {
    if (kind === 'lfx') {
      if (isPlaceholderLfxUrl(lfxUrl)) {
        return icsResponse(
          'LFX_ICS_URL is missing or still has the .env.example placeholder. Set the real Worker token in .env and restart the dev server.',
          500
        );
      }
      return icsResponse(trimIcsToWindow(await fetchIcs(lfxUrl)));
    }
    if (kind === 'custom') {
      return icsResponse(trimIcsToWindow(await fetchIcs(googleUrl)));
    }
    if (kind === 'merged') {
      const fetchEnv = isPlaceholderLfxUrl(lfxUrl)
        ? { lfxUrl: null, googleUrl }
        : { lfxUrl, googleUrl };
      const { bodies, errors } = await loadFeedBodies(fetchEnv);
      if (bodies.length === 0) {
        const message = errors
          .map((err) => err.message || String(err))
          .join('\n');
        return icsResponse(message || 'ICS proxy failed', 502);
      }
      return icsResponse(trimIcsToWindow(mergeIcsCalendars(bodies)));
    }
    return icsResponse('Not found', 404);
  } catch (err) {
    return icsResponse(err.message || 'ICS proxy failed', 502);
  }
}

export function pathToIcsKind(pathname) {
  if (pathname === '/feeds/lfx.ics') return 'lfx';
  if (pathname === '/feeds/custom.ics') return 'custom';
  if (pathname === '/calendar.ics') return 'merged';
  return null;
}
