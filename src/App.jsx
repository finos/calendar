import dayGridPlugin from '@fullcalendar/daygrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';

import { mdiCalendarRange, mdiClose, mdiMapMarkerOutline } from '@mdi/js';
import Icon from '@mdi/react';
import parse from 'html-react-parser';
import { createRef, useCallback, useMemo, useState } from 'react';
import SearchHeader from './components/SearchHeader';
import useEscKey from './hooks/useEscKey';
import eventData from '../dist/events.json';
import './App.css';

const htmlRegex = /<\/*html-blob>/;

function App() {
  const calendarRef = createRef();

  const eventsArray = Array.from(eventData);
  const [events, setEvents] = useState(eventsArray);

  const [loading, setLoading] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(
    window.outerWidth > window.innerHeight
      ? 1.35
      : window.innerWidth / window.innerHeight
  );
  const [initialView, setInitialView] = useState(
    window.outerWidth > 600 ? 'dayGridMonth' : 'timeGridWeek'
  );

  useEscKey(() => setShowEventDetails(false));

  const [popupPosition, setPopupPosition] = useState({});

  const windowResize = () => {
    setAspectRatio(
      window.outerWidth > window.innerHeight
        ? 1.35
        : window.innerWidth / window.innerHeight
    );
    setInitialView(window.outerWidth > 600 ? 'dayGridMonth' : 'timeGridWeek');
    setShowEventDetails(false);
    window.outerWidth < 600 && setPopupPosition({ left: 0, top: 0 });
  };

  const createPopupPosition = (event) => {
    const popup = { width: 330, height: 400 };
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

  const filterEvents = (searchTerm)=>{
    if(!searchTerm) return setEvents(eventsArray); //handles searchbox clear
    let matchingEvents = eventsArray.filter((event) => {
      const titleIncludes = event.title?.toLowerCase().includes(searchTerm.toLowerCase());
      const descriptionIncludes = event.description?.toLowerCase().includes(searchTerm.toLowerCase());
      return titleIncludes || descriptionIncludes;
    });
    setEvents(matchingEvents);
  };

  const handleEventClick = useCallback((clickInfo) => {
    window.outerWidth > 600 && createPopupPosition(clickInfo.jsEvent);
    setEventDetails(clickInfo.event);
    setShowEventDetails(true);
  }, []);

  function downloadICSFile() {
    // console.log("print ics");
    // console.log(eventDetails.extendedProps.ics);
    const file = new Blob([eventDetails.extendedProps.ics], {
      type: 'text/calendar',
    });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(file);
    element.download = 'finos-event.ics';
    document.body.appendChild(element);
    element.click();
  }

  const dateOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const timeOptions = {
    hour: '2-digit',
    minute: '2-digit',
  };
  function printDate(date) {
    if (date) {
      return date.toLocaleDateString(undefined, dateOptions);
    } else return 'NONE';
  }

  function printTime(date) {
    if (date) {
      const str = date.toLocaleDateString(undefined, timeOptions);
      return str.split(',')[1].trim();
    } else return 'NONE';
  }

  const renderEventDetails = () => {
    let description = eventDetails.extendedProps.description
      ? eventDetails.extendedProps.description.replace(htmlRegex, '')
      : '<i>No description</i>';
    const eventLocation = eventDetails.extendedProps.location;
    const fromDate = printDate(eventDetails.start);
    const toDate = printDate(eventDetails.end);
    const fromTime = printTime(eventDetails.start);
    const toTime = printTime(eventDetails.end);
    let eventTime = '';
    if (fromDate == toDate) {
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

    let seriesICS = '';
    if (eventDetails.extendedProps.rootIcsLink != null) {
      seriesICS = (
        <a href={eventDetails.extendedProps.rootIcsLink}>Series ICS</a>
      );
    }

    const extractUrls = (text) => {
      const urlPattern = /(?<!href\s*=\s*["'])\bhttps?:\/\/\S+\b/g;
      return text.match(urlPattern) || [];
    };

    const extractAnchors = (text) => {
      const urlPattern = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>.*?<\/a>/g;
      return text.match(urlPattern) || [];
    };

    function replaceUrlsWithAnchorTags(inputText) {
      const urls = extractUrls(inputText);
      const outputText = urls.reduce((text, url) => {
        const anchorTag = `<a href="${url}">${url}</a>`;
        const isAlreadyAnchorTagged = new RegExp(
          `<a\\s+[^>]*href\\s*=\\s*['"]?${url}['"]?[^>]*>.*?<\\/a>`
        ).test(text);
        return isAlreadyAnchorTagged ? text : text.replace(url, anchorTag);
      }, inputText);
      return outputText;
    }
    let formattedDescription = description;
    if (description) {
      if (extractUrls(description).length > extractAnchors(description).length)
        formattedDescription = replaceUrlsWithAnchorTags(description);
    }

    return (
      <div className="finos-calendar-event-details" style={popupPosition}>
        <button
          onClick={() => setShowEventDetails(false)}
          className="fc-button finos-calendar-event-details-close"
        >
          <Icon path={mdiClose} size={1} />
        </button>
        <button onClick={() => downloadICSFile()} className="fc-button">
          Event ICS
        </button>
        <div>{seriesICS}</div>
        <h2 className="event-title">{eventDetails.title}</h2>
        <div className="event-time">
          <div className="icon">
            <Icon path={mdiCalendarRange} size={0.75} />
          </div>
          <div>{eventTime}</div>
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
    [aspectRatio, initialView, calendarRef, handleEventClick, events]
  );

  return (
    <div className="App main">
      <SearchHeader filterEvents={filterEvents} />
      <div className="finos-calendar">{renderFullCalendar}</div>
      {showEventDetails && renderEventDetails()}
      {loading && <div className="finos-calendar-overlay" />}
      {loading && <div className="finos-calendar-loading">Loading...</div>}
    </div>
  );
}

export default App;
