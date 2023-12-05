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
		// console.log('event', clickInfo.event);
	});

	function downloadICSFile() {
		// console.log("print ics");
		// console.log(eventDetails.extendedProps.ics);
		const file = new Blob([eventDetails.extendedProps.ics], {type: 'text/calendar'});
		const element = document.createElement("a");
		element.href = URL.createObjectURL(file);
		element.download = "finos-event.ics";
		document.body.appendChild(element);
		element.click();
	}

	const dateOptions = {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
 	};
	 const timeOptions = {
		hour: '2-digit',
		minute:'2-digit'
 	};
	function printDate(date) {
		if (date) {
			return date.toLocaleDateString(undefined, dateOptions)
		}
		else return 'NONE';
	}

	function printTime(date) {
		if (date) {
			const str = date.toLocaleDateString(undefined, timeOptions)
			return str.split(',')[1].trim();
		}
		else return 'NONE';
	}

	const renderEventDetails = () => {
		const description = eventDetails.extendedProps.description.replace(htmlRegex, '');

		const fromDate = printDate(eventDetails.start);
		const toDate = printDate(eventDetails.end);
		const fromTime = printTime(eventDetails.start);
		const toTime = printTime(eventDetails.end);
		let eventTime = '';
		if (fromDate == toDate) {
			eventTime = fromDate + ' ' + fromTime + ' - ' + toTime;
		} else {
			eventTime = "<strong>From:</strong> " + fromDate + ' - ' + toDate + '<br/>' + "<strong>To:</strong> " + fromTime + ' ' + toTime;
		}

		let seriesICS = '';
		if (eventDetails.extendedProps.rootIcsLink != null) {
			seriesICS = <a href={eventDetails.extendedProps.rootIcsLink}>Series ICS</a>
		}

		return (
			<div className="finos-calendar-event-details">
				<button
					onClick={() => setShowEventDetails(false)}
					className="fc-button finos-calendar-event-details-close">
					X
				</button>
				<button
					onClick={() => downloadICSFile()}
					className="fc-button">
					Event ICS
				</button>
				<div>{seriesICS}</div>
				<h2>{eventDetails.title}</h2>
				<div>{eventTime}</div>
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
				events="events.json"
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
		),[]);

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
