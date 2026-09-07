import dayGridPlugin from '@fullcalendar/daygrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';

import { mdiMagnify } from '@mdi/js';
import Icon from '@mdi/react';
import { useMemo, useRef, useState } from 'react';

import EventDetails from './EventDetails.jsx';
import useEscKey from '../hooks/useEscKey.jsx';
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

const SOURCE_LABELS = {
  lfx: 'LFX meetings',
  custom: 'custom events',
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
  if (target.includes('lfx')) return SOURCE_LABELS.lfx;
  if (target.includes('custom')) return SOURCE_LABELS.custom;
  return 'calendar feeds';
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

export default function Calendar() {
  const calendarRef = useRef(null);
  const activeEventEl = useRef(null);

  const [loading, setLoading] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(getAspectRatio());
  const [initialView] = useState(getInitialView());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchMatchCount, setSearchMatchCount] = useState(null);
  const [popupPosition, setPopupPosition] = useState({});
  const [failedSources, setFailedSources] = useState([]);
  const [hiddenDays, setHiddenDays] = useState([]);

  const loadError = failedSources.length > 0 ? userFacingLoadError(failedSources) : null;

  const updateSearchMatchCount = (term) => {
    const query = term.trim();
    if (!query) {
      setSearchMatchCount(null);
      return;
    }
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const count = api
      .getEvents()
      .filter((event) => eventMatchesSearch(event, term)).length;
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

  const eventClassNames = (arg) =>
    eventMatchesSearch(arg.event, searchTerm) ? [] : ['fc-event-filtered'];

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
        eventDataTransform: (event) => ({
          ...event,
          extendedProps: { ...event.extendedProps, source: 'custom' },
        }),
      },
    ],
    []
  );

  const refreshHiddenWeekends = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const next = hiddenWeekendDays(
      eventRangesFromCalendar(api),
      api.view.activeStart,
      api.view.activeEnd
    );
    setHiddenDays((prev) => (sameHiddenDays(prev, next) ? prev : next));
    updateSearchMatchCount(searchTerm);
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
          <div className="search-container">
            <Icon path={mdiMagnify} size={1} aria-hidden="true" />
            <input
              type="search"
              placeholder="Search events..."
              value={searchTerm}
              onChange={handleSearchChange}
              aria-label="Search events"
            />
          </div>
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
          aspectRatio={aspectRatio}
          handleWindowResize={true}
          windowResize={windowResize}
          eventSources={eventSources}
          eventClassNames={eventClassNames}
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
      {loading && (
        <>
          <div className="finos-calendar-overlay" aria-hidden="true" />
          <div
            className="finos-calendar-loading"
            role="status"
            aria-live="polite"
          >
            <span className="finos-calendar-spinner" aria-hidden="true" />
            Loading calendar events…
          </div>
        </>
      )}
    </div>
  );
}
