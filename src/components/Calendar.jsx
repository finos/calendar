import dayGridPlugin from '@fullcalendar/daygrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';

import {
  mdiCalendarRange,
  mdiClock,
  mdiClose,
  mdiMapMarkerOutline,
} from '@mdi/js';
import Icon from '@mdi/react';
import parse from 'html-react-parser';
import React, {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import events from '../../dist/events.json';
import useEscKey from '../hooks/useEscKey';
import { printDate, printTime } from '../utils/date-time';
import { downloadICSFile } from '../utils/ics-download';
import { htmlRegex } from '../utils/regex';
import {
  extractAnchors,
  extractUrls,
  replaceUrlsWithAnchorTags,
} from '../utils/url-to-link';
import { getAspectRatio, getInitialView, isMinWidth } from '../utils/view-size';

function Calendar() {
  const calendarRef = createRef();
  const eventDetailRef = createRef();

  const [loading, setLoading] = useState(true);
  const [clickedEvent, setClickedEvent] = useState([]);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(getAspectRatio());
  const [initialView, setInitialView] = useState(getInitialView());

  useEscKey(() => setShowEventDetails(false));

  const [popupPosition, setPopupPosition] = useState({});

  const windowResize = () => {
    setAspectRatio(getAspectRatio());
    setInitialView(isMinWidth() ? 'dayGridMonth' : 'timeGridWeek');
    setShowEventDetails(false);
    !isMinWidth() && setPopupPosition({ left: 0, top: 0 });
  };

  const createPopupPosition = (event) => {
    const popup = { width: 330, height: 450 };
    let position = { top: event.pageY + 20, left: event.pageX + 50 };
    if (
      event.pageX + popup.width + 140 > window.outerWidth ||
      event.pageY + popup.height + 20 > document.body.scrollHeight
    ) {
      if (event.pageX + popup.width + 140 > window.outerWidth) {
        position.left = event.pageX - popup.width - 50;
        if (position.left < 0) position.left = position.left * -1;
      }
      if (event.pageY + popup.height + 20 > document.body.scrollHeight) {
        position.top = event.pageY - popup.height - 70;
        if (position.top < 0) position.top = position.top * -1;
      }
    }
    setPopupPosition({ left: position.left + 'px', top: position.top + 'px' });
  };

  const handleEventClick = useCallback(
    (clickInfo) => {
      isMinWidth() && createPopupPosition(clickInfo.jsEvent);
      setEventDetails(clickInfo.event);
      setShowEventDetails(true);
      if (clickedEvent.length) {
        clickedEvent[0].classList.remove('active-event');
        setClickedEvent([]);
      }
      const event = clickInfo.jsEvent.target.closest('a.fc-event');
      event.classList.add('active-event');
      setClickedEvent([event]);
    },
    [clickedEvent]
  );

  useEffect(() => {
    const closeOnOutsideClick = (e) => {
      if (e.target.closest('.fc-event') || eventDetailRef.current == null)
        return;
      if (showEventDetails && !eventDetailRef.current.contains(e.target))
        setShowEventDetails(false);
    };

    document.body.addEventListener('click', closeOnOutsideClick);
    return () => document.removeEventListener('click', closeOnOutsideClick);
  }, [eventDetailRef, showEventDetails]);

  const renderEventDetails = () => {
    let description = eventDetails.extendedProps.description
      ? eventDetails.extendedProps.description.replace(htmlRegex, '')
      : '<i>No description</i>';
    const eventLocation = eventDetails.extendedProps.location;
    const fromDate = printDate(eventDetails.start);
    const toDate = printDate(eventDetails.end);
    const fromTime = printTime(eventDetails.start);
    const toTime = printTime(eventDetails.end);
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let eventTime = '';
    if (fromDate === toDate) {
      eventTime = fromDate + ' ' + fromTime + ' - ' + toTime;
    } else {
      eventTime =
        <strong>From:</strong> +
        fromDate +
        ' - ' +
        toDate +
        <br /> +
        <strong>To:</strong> +
        fromTime +
        ' ' +
        toTime;
    }

    let formattedDescription = description;

    if (description) {
      if (extractUrls(description).length > extractAnchors(description).length)
        formattedDescription = replaceUrlsWithAnchorTags(description);
    }

    return (
      <div
        ref={eventDetailRef}
        key={description}
        className="finos-calendar-event-details"
        style={popupPosition}
      >
        <div className="event-details-buttons">
          <button
            onClick={() => downloadICSFile(eventDetails)}
            className="fc-button"
          >
            Event ICS
          </button>
          <button
            onClick={() => setShowEventDetails(false)}
            className="fc-button finos-calendar-event-details-close"
          >
            <Icon path={mdiClose} size={1} />
          </button>
        </div>
        <h2 className="event-title">{eventDetails.title}</h2>
        <div className="event-time">
          <div className="icon">
            <Icon path={mdiCalendarRange} size={0.75} />
          </div>
          <div>{eventTime}</div>
        </div>
        <div className="event-timeZone">
          <div className="icon">
            <Icon path={mdiClock} size={0.75} />
          </div>
          <div>Time Zone: {timeZone}</div>
        </div>
        {eventLocation && (
          <div className="event-location">
            <div className="icon">
              <Icon path={mdiMapMarkerOutline} size={0.75} />
            </div>
            <div>{eventLocation}</div>
          </div>
        )}
        <br />
        {parse(formattedDescription)}
      </div>
    );
  };

  const renderFullCalendar = useMemo(
    () => (
      <FullCalendar
        ref={calendarRef}
        plugins={[
          dayGridPlugin,
          iCalendarPlugin,
          interactionPlugin,
          timeGridPlugin,
          rrulePlugin,
        ]}
        initialView={initialView}
        aspectRatio={aspectRatio}
        handleWindowResize={true}
        windowResize={windowResize}
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        dayMaxEventRows={999}
        initialDate={new Date().toISOString().slice(0, 10)}
        navLinks
        editable
        dayMaxEvents
        eventClick={handleEventClick}
        loading={(isLoading) => setLoading(isLoading)}
      />
    ),
    [aspectRatio, initialView, calendarRef, handleEventClick]
  );

  return (
    <div className="content">
      <div data-testid="finos-calendar" className="finos-calendar">
        {renderFullCalendar}
      </div>
      {showEventDetails && renderEventDetails()}
      {loading && <div className="finos-calendar-overlay" />}
      {loading && <div className="finos-calendar-loading">Loading...</div>}
    </div>
  );
}

export default Calendar;
