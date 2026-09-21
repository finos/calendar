export const LFX_MEETINGS_URL =
  'https://pcc-bff.platform.linuxfoundation.org/production/api/v2/itx-services/public/meetings/finos?view=pcc&pageSize=9999';

export const LFX_JSON_CACHE_CONTROL = 'public, max-age=300';
export const LFX_UPSTREAM_CACHE_TTL_MS = 5 * 60 * 1000;

const FETCH_HEADERS = {
  'User-Agent': 'FINOS-Calendar/1.0 (https://calendar.finos.org)',
  Accept: 'application/json',
};

/** @type {Map<string, { body?: unknown, expires: number, inflight?: Promise<unknown> }>} */
const upstreamCache = new Map();

export function clearLfxMeetingsCache() {
  upstreamCache.clear();
}

export function lfxPastMeetingsUrl(startDate, endDate) {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
  });
  return `https://pcc-bff.platform.linuxfoundation.org/production/api/v2/itx-services/public/meetings/finos/past?${params}`;
}

function toDateMs(value) {
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function filterMeetingsByRange(meetings, rangeStartMs, rangeEndMs) {
  return (meetings || []).filter((meeting) => {
    const startMs = toDateMs(meeting?.start);
    if (startMs == null) return false;
    return startMs >= rangeStartMs && startMs <= rangeEndMs;
  });
}

/**
 * LFX instance `id` is the start unix timestamp, so concurrent meetings collide.
 * Prefer meeting_id + start for a stable unique key across past/upcoming feeds.
 */
export function lfxMeetingInstanceKey(meeting) {
  const props = meeting?.extendedProps || {};
  const meetingId = props.meeting_id != null ? String(props.meeting_id) : '';
  const start = meeting?.start || '';
  if (meetingId && start) return `${meetingId}:${start}`;
  if (meetingId) return `meeting:${meetingId}:${meeting?.id ?? ''}`;
  return `id:${meeting?.id ?? ''}:${start}`;
}

export function mapLfxMeetingToEvent(meeting) {
  const props = meeting?.extendedProps || {};
  const shareUrl = props.share_url || '';
  const agenda = String(props.agenda || '').trim();
  const description = [agenda, shareUrl ? `Ways to join meeting:\n\n${shareUrl}` : '']
    .filter(Boolean)
    .join('\n\n');
  const meetingId = props.meeting_id != null ? String(props.meeting_id) : '';

  return {
    id: lfxMeetingInstanceKey(meeting),
    title: meeting.title || 'Untitled',
    start: meeting.start,
    end: meeting.end || null,
    url: shareUrl || undefined,
    extendedProps: {
      location: shareUrl,
      description,
      projectSlug: props.project_slug || props.project?.Slug || '',
      projectName: props.project?.Name || '',
      meetingId,
    },
  };
}

async function fetchJsonCached(url) {
  const cached = upstreamCache.get(url);
  if (cached?.body != null && cached.expires > Date.now()) {
    return cached.body;
  }
  if (cached?.inflight) {
    return cached.inflight;
  }

  const inflight = (async () => {
    const res = await fetch(url, { headers: FETCH_HEADERS });
    if (!res.ok) {
      throw new Error(`LFX meetings fetch failed ${res.status}`);
    }
    const body = await res.json();
    upstreamCache.set(url, {
      body,
      expires: Date.now() + LFX_UPSTREAM_CACHE_TTL_MS,
    });
    return body;
  })().catch((err) => {
    const current = upstreamCache.get(url);
    if (current?.inflight) {
      upstreamCache.delete(url);
    }
    throw err;
  });

  upstreamCache.set(url, { expires: 0, inflight });
  return inflight;
}

function ymd(date) {
  const value = date instanceof Date ? date : new Date(date);
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Load LFX meetings overlapping [rangeStart, rangeEnd] (Date or ms).
 * Upcoming feed is cached whole; past feed is fetched for the date window.
 */
export async function loadLfxMeetingsInRange(rangeStart, rangeEnd) {
  const rangeStartMs = +new Date(rangeStart);
  const rangeEndMs = +new Date(rangeEnd);
  const nowMs = Date.now();

  const tasks = [fetchJsonCached(LFX_MEETINGS_URL)];
  if (rangeStartMs < nowMs) {
    tasks.push(
      fetchJsonCached(
        lfxPastMeetingsUrl(ymd(rangeStartMs), ymd(Math.min(rangeEndMs, nowMs)))
      )
    );
  }

  const results = await Promise.allSettled(tasks);
  const meetings = [];
  const errors = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      meetings.push(...(result.value?.meetings || []));
    } else {
      errors.push(result.reason);
    }
  }

  if (meetings.length === 0 && errors.length > 0) {
    throw errors[0];
  }

  const filtered = filterMeetingsByRange(meetings, rangeStartMs, rangeEndMs);
  // De-dupe past/upcoming overlap near "now" — not by raw id (that's start time)
  const byKey = new Map();
  for (const meeting of filtered) {
    byKey.set(lfxMeetingInstanceKey(meeting), meeting);
  }
  return [...byKey.values()].map(mapLfxMeetingToEvent);
}

export function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control':
        status === 200 ? LFX_JSON_CACHE_CONTROL : 'no-store',
    },
  });
}

export async function handleLfxMeetingsRequest(requestUrl) {
  try {
    const url = new URL(requestUrl, 'http://localhost');
    const startParam = url.searchParams.get('start');
    const endParam = url.searchParams.get('end');
    const rangeStart = startParam ? new Date(startParam) : new Date();
    const rangeEnd = endParam
      ? new Date(endParam)
      : new Date(rangeStart.getTime() + 60 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(+rangeStart) || Number.isNaN(+rangeEnd)) {
      return jsonResponse({ error: 'Invalid start/end' }, 400);
    }

    const events = await loadLfxMeetingsInRange(rangeStart, rangeEnd);
    return jsonResponse({ events });
  } catch (err) {
    return jsonResponse(
      { error: err.message || 'LFX meetings proxy failed' },
      502
    );
  }
}
