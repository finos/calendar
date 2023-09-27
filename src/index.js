import { Calendar, formatDate } from '@fullcalendar/core';
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
        timeZone: 'America/New_York',
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
                    
                    const startTime = info.event.start
                    const endTime = info.event.end

                    const formattedStartTime = formatDate(startTime, {
                        hour: 'numeric',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    });

                    const formattedEndTime = formatDate(endTime, {
                        hour: 'numeric',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    });

                    const modalContent = document.createElement('div');
                    modalContent.classList.add('modal-content');
                    modalContent.innerHTML = `<b>${info.event.title}</b><br></br><strong>Start:</strong> ${formattedStartTime}<br><strong>End:</strong> ${formattedEndTime}<br><br>${info.event.extendedProps.description}<br>`;
                    modalContainer.appendChild(modalContent);

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
});
