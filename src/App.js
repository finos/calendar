import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';

import './App.css';

function renderEventContent(info) {
  return <b class="fc-event-title">{info.event.title}</b>;
}

function App() {
  // Get the current date as a string in the format 'YYYY-MM-DD'
  const currentDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="App">
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
        dayMaxEvents={false}
        eventContent={renderEventContent}
      />
    </div>
  );
}

export default App;
