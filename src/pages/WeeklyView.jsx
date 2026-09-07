import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

import { parseIcsEvents } from '../utils/ics-parse.js';
import { eventInviteUrl } from '../utils/lfx-invite.js';

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(date, timezone) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    hour12: true,
  });
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getEventsForDate(date, allEvents) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return allEvents
    .filter((event) => event.start >= startOfDay && event.start <= endOfDay)
    .sort((a, b) => a.start - b.start);
}

export default function WeeklyView() {
  const [searchParams] = useSearchParams();
  const [weekEvents, setWeekEvents] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateParam = searchParams.get('date');

  useEffect(() => {
    let cancelled = false;
    const startDate = dateParam ? new Date(dateParam) : new Date();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/calendar.ics');
        if (!response.ok) {
          throw new Error(`Could not load calendar (${response.status})`);
        }
        const ics = await response.text();
        const rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(rangeStart);
        rangeEnd.setDate(rangeEnd.getDate() + 7);

        const events = parseIcsEvents(ics, rangeStart, rangeEnd);
        const dates = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(rangeStart);
          date.setDate(date.getDate() + i);
          return date;
        });

        const grouped = dates
          .map((date) => ({
            date,
            events: getEventsForDate(date, events),
          }))
          .filter((day) => day.events.length > 0);

        if (!cancelled) setWeekEvents(grouped);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateParam]);

  const today = new Date();

  return (
    <div className="weekly-view">
      <h1>This Week At FINOS</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="weekly-view-error">{error}</p>}
      {!loading && !error && weekEvents.length === 0 && (
        <p>No events this week.</p>
      )}
      {weekEvents.map(({ date, events }) => {
        const isToday = isSameCalendarDay(date, today);
        return (
        <div
          key={date.toISOString()}
          className={
            isToday ? 'weekly-view-day weekly-view-day-today' : 'weekly-view-day'
          }
        >
          <h2>
            {formatDate(date)}
            {isToday && <span className="weekly-view-today-badge">Today</span>}
          </h2>
          <ul>
            {events.map((event) => {
              const inviteUrl = eventInviteUrl(event);
              return (
                <li key={`${event.uid}-${event.start.toISOString()}`}>
                  <span style={{ color: '#666' }}>
                    {formatTime(event.start, 'America/New_York')} NYC /{' '}
                    {formatTime(event.start, 'Europe/London')} UK
                  </span>{' '}
                  - {event.title}
                  {inviteUrl && (
                    <>
                      {' '}
                      -{' '}
                      <a href={inviteUrl} target="_blank" rel="noreferrer">
                        Invite Me
                      </a>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </div>
  );
}
