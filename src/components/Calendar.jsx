import dayGridPlugin from '@fullcalendar/daygrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';

import { mdiMagnify } from '@mdi/js';
import Icon from '@mdi/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import EventDetails from './EventDetails.jsx';
import useEscKey from '../hooks/useEscKey.jsx';
import { parseHighlightTitle } from '../utils/event-highlight.js';
import { eventMatchesSearch } from '../utils/event-search.js';
import {
  eventRangesFromCalendar,
  hiddenWeekendDays,
  sameHiddenDays,
} from '../utils/hidden-weekends.js';
import { popupPositionFromClick } from '../utils/popup-position.js';
import { getAspectRatio, getInitialView, isMinWidth } from '../utils/view-size.js';

const LFX_COLOR = {
  backgroundColor: '#e5f6fb',
  borderColor: '#00b5e2',
  textColor: '#063542',
};

const CUSTOM_COLOR = {
  backgroundColor: '#fff4e0',
  borderColor: '#d97706',
  textColor: '#633806',
};

const FEEDS = {
  lfx: {
    id: 'lfx',
    label: 'Project Meetings',
    failureLabel: 'LFX meetings',
  },
  custom: {
    id: 'custom',
    label: 'Events',
    failureLabel: 'custom events',
  },
};

function renderDayHeader(arg) {
  if (arg.view.type === 'dayGridMonth') {
    return arg.text;
  }

  return (
    <span className={arg.isToday ? 'cal-dow cal-dow-today' : 'cal-dow'}>
      <span className="cal-dow-name">
        {arg.date.toLocaleDateString(undefined, { weekday: 'short' })}
      </span>
      <span className="cal-dow-num">{arg.date.getDate()}</span>
    </span>
  );
}

function feedLabelFromFailure(error) {
  const message = error?.message?.toLowerCase() || '';
  const url = error?.xhr?.responseURL || error?.url || '';
  const target = `${message} ${url}`.toLowerCase();
  if (target.includes('lfx')) return FEEDS.lfx.failureLabel;
  if (target.includes('custom')) return FEEDS.custom.failureLabel;
  return 'calendar feeds';
}

function eventMatchesFeed(event, feedFilter) {
  if (feedFilter === 'all') return true;
  return event.extendedProps?.source === feedFilter;
}

function userFacingLoadError(failedSources) {
  if (failedSources.length === 0) {
    return 'Could not load calendar events. Please try again.';
  }
  if (failedSources.length === 1) {
    return `Could not load ${failedSources[0]}. Other events may still appear.`;
  }
  return 'Could not load calendar events. Please try again.';
}

function transformCustomEvent(event) {
  const { title, highlighted } = parseHighlightTitle(event.title);
  return {
    ...event,
    title,
    order: highlighted ? -100 : 0,
    classNames: highlighted ? ['event-highlight'] : [],
    extendedProps: {
      ...event.extendedProps,
      source: 'custom',
      highlighted,
    },
  };
}

export default function Calendar() {
  const calendarRef = useRef(null);
  const activeEventEl = useRef(null);

  const [loading, setLoading] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(getAspectRatio());
  const [calendarHeight, setCalendarHeight] = useState(
    () => (getInitialView() === 'dayGridDay' ? 'auto' : undefined)
  );
  const [initialView] = useState(getInitialView());
  const [feedFilter, setFeedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(null);
  const [popupPosition, setPopupPosition] = useState({});
  const [failedSources, setFailedSources] = useState([]);
  const [hiddenDays, setHiddenDays] = useState([]);

  const loadError = failedSources.length > 0 ? userFacingLoadError(failedSources) : null;

  const updateSearchMatchCount = (term, filter = feedFilter) => {
    const query = term.trim();
    if (!query) {
      setSearchMatchCount(null);
      return;
    }
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const count = api
      .getEvents()
      .filter(
        (event) =>
          eventMatchesFeed(event, filter) && eventMatchesSearch(event, term)
      ).length;
    setSearchMatchCount(count);
  };

  const closeEventDetails = () => {
    const eventEl = activeEventEl.current;
    setShowEventDetails(false);
    setEventDetails(null);
    if (eventEl) {
      eventEl.classList.remove('active-event');
      activeEventEl.current = null;
      eventEl.focus();
    }
  };

  useEscKey(closeEventDetails);

  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const next = hiddenWeekendDays(
      eventRangesFromCalendar(api, feedFilter),
      api.view.activeStart,
      api.view.activeEnd
    );
    setHiddenDays((prev) => (sameHiddenDays(prev, next) ? prev : next));
  }, [feedFilter]);

  const windowResize = () => {
    setAspectRatio(getAspectRatio());
    closeEventDetails();
    if (!isMinWidth()) setPopupPosition({});
  };

  const handleEventClick = (clickInfo) => {
    clickInfo.jsEvent.preventDefault();
    clickInfo.jsEvent.stopPropagation();
    setPopupPosition(popupPositionFromClick(clickInfo.jsEvent));
    setEventDetails(clickInfo.event);
    setShowEventDetails(true);

    if (activeEventEl.current) {
      activeEventEl.current.classList.remove('active-event');
    }
    const eventEl = clickInfo.jsEvent.target.closest('a.fc-event');
    if (eventEl) {
      eventEl.classList.add('active-event');
      activeEventEl.current = eventEl;
    }
  };

  const eventClassNames = (arg) => {
    const classes = [];
    if (arg.event.extendedProps?.highlighted) {
      classes.push('event-highlight');
    }
    if (!eventMatchesFeed(arg.event, feedFilter)) {
      classes.push('fc-event-filtered');
    }
    if (!eventMatchesSearch(arg.event, searchTerm)) {
      classes.push('fc-event-filtered');
    }
    return classes;
  };

  const eventOrder = (a, b) => {
    const ha = a.extendedProps?.highlighted ? 0 : 1;
    const hb = b.extendedProps?.highlighted ? 0 : 1;
    return ha - hb;
  };

  const eventSources = useMemo(
    () => [
      {
        id: 'lfx',
        url: '/feeds/lfx.ics',
        format: 'ics',
        className: 'event-lfx',
        backgroundColor: LFX_COLOR.backgroundColor,
        borderColor: LFX_COLOR.borderColor,
        textColor: LFX_COLOR.textColor,
        eventDataTransform: (event) => ({
          ...event,
          extendedProps: { ...event.extendedProps, source: 'lfx' },
        }),
      },
      {
        id: 'custom',
        url: '/feeds/custom.ics',
        format: 'ics',
        className: 'event-custom',
        backgroundColor: CUSTOM_COLOR.backgroundColor,
        borderColor: CUSTOM_COLOR.borderColor,
        textColor: CUSTOM_COLOR.textColor,
        eventDataTransform: transformCustomEvent,
      },
    ],
    []
  );

  const refreshHiddenWeekends = (dateInfo) => {
    const viewType = dateInfo?.view?.type;
    if (viewType) {
      setCalendarHeight(viewType === 'dayGridDay' ? 'auto' : undefined);
    }
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const next = hiddenWeekendDays(
      eventRangesFromCalendar(api, feedFilter),
      api.view.activeStart,
      api.view.activeEnd
    );
    setHiddenDays((prev) => (sameHiddenDays(prev, next) ? prev : next));
    updateSearchMatchCount(searchTerm, feedFilter);
  };

  const handleEventSourceFailure = (error) => {
    const label = feedLabelFromFailure(error);
    setFailedSources((prev) =>
      prev.includes(label) ? prev : [...prev, label]
    );
    setLoading(false);
  };

  const retryFeeds = () => {
    setFailedSources([]);
    setLoading(true);
    calendarRef.current?.getApi()?.refetchEvents();
  };

  const handleFeedFilterChange = (feed) => {
    const next = feedFilter === feed ? 'all' : feed;
    closeEventDetails();
    setFeedFilter(next);
    updateSearchMatchCount(searchTerm, next);
  };

  const handleSearchChange = (event) => {
    const term = event.target.value;
    setSearchTerm(term);
    updateSearchMatchCount(term);
  };

  const searchStatusMessage = useMemo(() => {
    if (!searchTerm.trim() || searchMatchCount === null) return '';
    if (searchMatchCount === 0) return 'No events match your search.';
    if (searchMatchCount === 1) return '1 event matches your search.';
    return `${searchMatchCount} events match your search.`;
  }, [searchMatchCount, searchTerm]);

  return (
    <div className="content">
      <div data-testid="finos-calendar" className="finos-calendar">
        <div className="calendar-toolbar">
          <div className="calendar-toolbar-row">
            <div className="calendar-feed-filter">
              <div
                className={
                  feedFilter === 'all'
                    ? 'calendar-feed-toggle'
                    : 'calendar-feed-toggle calendar-feed-toggle-active'
                }
                role="group"
                aria-label="Filter calendar events"
              >
                {Object.values(FEEDS).map((feed) => (
                  <button
                    key={feed.id}
                    type="button"
                    className={
                      feedFilter === feed.id
                        ? 'calendar-feed-btn calendar-feed-btn-active'
                        : 'calendar-feed-btn'
                    }
                    aria-pressed={feedFilter === feed.id}
                    title={
                      feedFilter === feed.id
                        ? `Clear ${feed.label} filter`
                        : `Show only ${feed.label}`
                    }
                    onClick={() => handleFeedFilterChange(feed.id)}
                  >
                    {feed.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="search-container">
              <Icon path={mdiMagnify} size={0.9} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search events..."
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search events"
              />
            </div>
          </div>
          <p className="calendar-feed-filter-status" role="status" aria-live="polite">
            {feedFilter === 'all'
              ? 'Showing all calendars'
              : `Showing ${FEEDS[feedFilter].label} only`}
          </p>
          {searchStatusMessage && (
            <p className="search-status" role="status" aria-live="polite">
              {searchStatusMessage}
            </p>
          )}
          {loadError && (
            <div className="calendar-load-error-panel" role="alert">
              <p className="calendar-load-error">{loadError}</p>
              <button
                type="button"
                className="calendar-retry-btn"
                onClick={retryFeeds}
              >
                Retry
              </button>
            </div>
          )}
          {loading && (
            <p className="calendar-loading-inline" role="status" aria-live="polite">
              <span className="finos-calendar-spinner" aria-hidden="true" />
              Loading calendar events…
            </p>
          )}
        </div>
        <FullCalendar
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            iCalendarPlugin,
            interactionPlugin,
            rrulePlugin,
          ]}
          initialView={initialView}
          height={calendarHeight}
          aspectRatio={calendarHeight === 'auto' ? undefined : aspectRatio}
          handleWindowResize={true}
          windowResize={windowResize}
          eventSources={eventSources}
          eventClassNames={eventClassNames}
          eventOrder={eventOrder}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek,dayGridDay',
          }}
          dayHeaderContent={renderDayHeader}
          dayMaxEventRows={999}
          initialDate={new Date().toISOString().slice(0, 10)}
          navLinks
          editable={false}
          dayMaxEvents
          hiddenDays={hiddenDays}
          datesSet={refreshHiddenWeekends}
          eventsSet={refreshHiddenWeekends}
          eventClick={handleEventClick}
          eventSourceFailure={handleEventSourceFailure}
          loading={(isLoading) => setLoading(isLoading)}
        />
      </div>
      {showEventDetails && eventDetails && (
        <>
          <button
            type="button"
            className="event-popover-backdrop"
            aria-label="Close event details"
            onClick={closeEventDetails}
          />
          <EventDetails
            key={eventDetails.id}
            event={eventDetails}
            position={popupPosition}
            onClose={closeEventDetails}
          />
        </>
      )}
    </div>
  );
}
