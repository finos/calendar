import { createRef, useCallback, useMemo, useState } from 'react';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import parse from 'html-react-parser';

import useEscKey from './hooks/useEscKey';

import './App.css';

function App() {
  const calendarRef = createRef();

  const [loading, setLoading] = useState(true);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(false);

  useEscKey(() => setShowEventDetails(false));

  const handleEventClick = useCallback((clickInfo) => {
    setEventDetails(clickInfo.event);
    setShowEventDetails(true);
  });

  const renderEventDetails = () => {
    return (
      <div className="finos-calendar-event-details">
        <button
          onClick={() => setShowEventDetails(false)}
          className="fc-button finos-calendar-event-details-close"
        >
          X
        </button>
        <h2>{eventDetails.title}</h2>
        <div>
          <strong>Start:</strong> {eventDetails.start.toLocaleString()} EST
        </div>
        <div>
          <strong>End:</strong> {eventDetails.end.toLocaleString()} EST
        </div>
        {parse(eventDetails.extendedProps.description)}
      </div>
    );
  };

  const renderFullCalendar = useMemo(
    () => (
      <FullCalendar
        ref={calendarRef}
        plugins={[
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
          iCalendarPlugin,
        ]}
        initialView="dayGridMonth"
        events={{
          url: 'basic.ics',
          format: 'ics',
        }}
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
    []
  );

  return (
    <div className="App main">
      <div className="finos-calendar">{renderFullCalendar}</div>
      {showEventDetails && renderEventDetails()}
      {loading && <div className="finos-calendar-overlay" />}
      {loading && <div className="finos-calendar-loading">Loading...</div>}
    </div>
  );
}

export default App;
