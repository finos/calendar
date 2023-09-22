import { useCallback, useMemo, useState, Suspense } from 'react';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import parse from 'html-react-parser';

import './App.css';

function App() {
  // Get the current date as a string in the format 'YYYY-MM-DD'
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [eventDetails, setEventDetails] = useState(false);

  const handleEventClick = useCallback((clickInfo) => {
    setEventDetails(clickInfo.event);
    setShowEventDetails(true);
  });

  const renderEventDetails = () => (
    <div className="finos-calendar-event-details">
      <button onClick={() => setShowEventDetails(false)}>Close</button>
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

  const renderFullCalendar = useMemo(
    () => (
      <FullCalendar
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
        initialDate={currentDate}
        navLinks
        editable
        dayMaxEvents
        // eventContent={renderEventContent}
        eventClick={handleEventClick}
      />
    ),
    []
  );

  return (
    <div className="App main">
      <div className="finos-calendar">{renderFullCalendar}</div>
      {showEventDetails && renderEventDetails()}
    </div>
  );
}

export default App;
