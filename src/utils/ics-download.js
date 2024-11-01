export function downloadICSFile(eventDetails) {
  const file = new Blob([eventDetails.extendedProps.ics], {
    type: 'text/calendar',
  });
  const element = document.createElement('a');
  element.href = URL.createObjectURL(file);
  element.download = 'finos-event.ics';
  document.body.appendChild(element);
  element.click();
}
