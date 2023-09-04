import { Calendar } from '@fullcalendar/core';
import interactionPlugin from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import iCalendarPlugin from '@fullcalendar/icalendar';
import tippy from 'tippy.js'; 
import 'tippy.js/dist/tippy.css'; 
import './index.css';

document.addEventListener('DOMContentLoaded', function() {
    var calendarEl = document.getElementById('calendar');

    // Get the current date as a string in the format 'YYYY-MM-DD'
    const currentDate = new Date().toISOString().slice(0, 10);

    var calendar = new Calendar(calendarEl, {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, iCalendarPlugin],
        events: {
            url: 'basic.ics',
            format: 'ics'
        },  
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        dayMaxEventRows: 999,
        initialDate: currentDate,
        navLinks: true, // can click day/week names to navigate views
        editable: true,
        dayMaxEvents: false, // allow "more" link when too many events
        eventContent: function (info) {
            return {
                html: `<b class="fc-event-title">${info.event.title}</b>`
            };
        },
        eventDidMount: function (info) {
            // Attach a tooltip to the event element
            tippy(info.el, {
                content: info.event.extendedProps.description,
                interactive: true,
                trigger: 'click', // Show the tooltip on click
                onShow(instance) {
                    // Create a clickable popup when the tooltip is shown
                    const modalContainer = document.createElement('div');
                    modalContainer.classList.add('modal-container');
                    modalContainer.classList.add('fc-event-tooltip');

                    const modalContent = document.createElement('div');
                    modalContent.classList.add('modal-content');
                    modalContent.innerHTML = `<b>${info.event.title}</b><br></br><strong>Start:</strong> ${info.event.start.toLocaleString()} EST<br><strong>End:</strong> ${info.event.end.toLocaleString()} EST<br><br>${info.event.extendedProps.description}<br>`;
                    modalContainer.appendChild(modalContent);

                    // Add a "Download ICS" button to the popup
                    const downloadButton = document.createElement('button');
                    downloadButton.innerHTML = 'Download ICS';
                    downloadButton.classList.add('modal-download');
                    downloadButton.addEventListener('click', () => {
                        // Generate and trigger the download of the ICS file
                        generateAndDownloadICS(info.event);
                    });
                    modalContent.appendChild(downloadButton);

                    // Add a close button to the popup
                    const closeButton = document.createElement('button');
                    closeButton.innerHTML = 'Close';
                    closeButton.classList.add('modal-close');
                    closeButton.addEventListener('click', () => instance.hide());
                    modalContent.appendChild(closeButton);

                    instance.setContent(modalContainer);
                },
            });
        }
    });

    calendar.render();


    // Function to generate ICS data from the event, including recurring events
    function generateAndDownloadICS(event) {
        const startDate = event.start.toISOString();
        const endDate = event.end.toISOString();

        // Remove HTML tags from the description
        const descriptionWithoutHTML = event.extendedProps.description.replace(/<\/?[^>]+(>|$)/g, "");

        const icsData = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${generateUID()}   // Generate a unique ID for the event
DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, "") + "Z"}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${descriptionWithoutHTML}
END:VEVENT
END:VCALENDAR`;

        // Create a Blob from the ICS data
        const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });

        // Create a download link for the Blob
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${event.title}.ics`;

        // Simulate a click on the link to trigger the download
        link.click();
    }

    // Function to generate a unique UID for the event
    function generateUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
});

