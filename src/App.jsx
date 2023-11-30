import { createRef, useCallback, useMemo, useState } from 'react';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import iCalendarPlugin from '@fullcalendar/icalendar';
import interactionPlugin from '@fullcalendar/interaction';
import parse from 'html-react-parser';
import timeGridPlugin from '@fullcalendar/timegrid';
import rrulePlugin from '@fullcalendar/rrule';

import useEscKey from './hooks/useEscKey';

import './App.css';

const htmlRegex = /<\/*html-blob>/;

function App() {
	const calendarRef = createRef();

	const [ loading, setLoading ] = useState(true);
	const [ showEventDetails, setShowEventDetails ] = useState(false);
	const [ eventDetails, setEventDetails ] = useState(false);

	useEscKey(() => setShowEventDetails(false));

	const handleEventClick = useCallback((clickInfo) => {
		setEventDetails(clickInfo.event);
		setShowEventDetails(true);
		console.log('event', clickInfo.event);
	});

	function printDate(date) {
		if (date) {
			return date.toString();
		}
		else return 'NONE';
	}

	const renderEventDetails = () => {
		const description = eventDetails.extendedProps.description.replace(htmlRegex, '');

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
					<strong>Start:</strong> {printDate(eventDetails.start)}
				</div>
				<div>
					<strong>End:</strong> {printDate(eventDetails.end)}
				</div>
				<br />
				{parse(description)}
			</div>
		);
	};

	const renderFullCalendar = useMemo(
		() => (
			<FullCalendar
				ref={calendarRef}
				plugins={[ dayGridPlugin, iCalendarPlugin, interactionPlugin, timeGridPlugin, rrulePlugin ]}
				initialView="dayGridMonth"
				events="dist/events.json"
				headerToolbar={{
					left   : 'prev,next today',
					center : 'title',
					right  : 'dayGridMonth,timeGridWeek,timeGridDay'
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
