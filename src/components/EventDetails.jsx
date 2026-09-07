import {
  mdiAccountPlus,
  mdiCalendarRange,
  mdiClock,
  mdiClose,
  mdiDownload,
  mdiMapMarkerOutline,
  mdiOpenInNew,
} from '@mdi/js';
import Icon from '@mdi/react';
import parse from 'html-react-parser';
import { useEffect, useId, useRef, useState } from 'react';

import useFocusTrap from '../hooks/useFocusTrap.jsx';
import {
  isHttpUrl,
  splitMeetingDescription,
} from '../utils/event-description.js';
import { printDate, printTime } from '../utils/date-time.js';
import { downloadICSFile } from '../utils/ics-download.js';
import { eventInviteUrl } from '../utils/lfx-invite.js';
import { htmlRegex } from '../utils/regex.js';
import {
  extractAnchors,
  extractUrls,
  replaceUrlsWithAnchorTags,
} from '../utils/url-to-link.js';

function formatHtml(text) {
  if (!text) return '';
  let html = text.replace(htmlRegex, '');
  if (extractUrls(html).length > extractAnchors(html).length) {
    html = replaceUrlsWithAnchorTags(html);
  }
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    html = html.replace(/\n/g, '<br />');
  }
  return html;
}

export default function EventDetails({ event, position, onClose }) {
  const titleId = useId();
  const detailsId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const [showJoinDetails, setShowJoinDetails] = useState(false);
  const inviteUrl = eventInviteUrl(event);
  const location = event.extendedProps?.location || '';
  const source = event.extendedProps?.source;
  const { summary, details } = splitMeetingDescription(
    event.extendedProps?.description
  );
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const fromDate = printDate(event.start);
  const toDate = printDate(event.end);
  const fromTime = printTime(event.start);
  const toTime = printTime(event.end);
  const sameDay = fromDate === toDate;

  const locationIsJoinLink = isHttpUrl(location);

  useFocusTrap(dialogRef, true);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      ref={dialogRef}
      className={`event-popover event-popover-${source || 'custom'}`}
      style={position}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="event-popover-header">
        <h2 id={titleId} className="event-popover-title">
          {event.title}
        </h2>
        <button
          ref={closeRef}
          type="button"
          className="event-popover-close"
          onClick={onClose}
          aria-label="Close event details"
        >
          <Icon path={mdiClose} size={0.9} aria-hidden="true" />
        </button>
      </div>

      <dl className="event-popover-meta">
        <div>
          <dt>
            <Icon path={mdiCalendarRange} size={0.7} aria-hidden="true" />
            Date
          </dt>
          <dd>{sameDay ? fromDate : `${fromDate} – ${toDate}`}</dd>
        </div>
        <div>
          <dt>
            <Icon path={mdiClock} size={0.7} aria-hidden="true" />
            Time
          </dt>
          <dd>
            {fromTime} – {toTime}
            <span className="event-popover-tz">{timeZone}</span>
          </dd>
        </div>
        {location && !locationIsJoinLink && (
          <div>
            <dt>
              <Icon path={mdiMapMarkerOutline} size={0.7} aria-hidden="true" />
              Location
            </dt>
            <dd>{location}</dd>
          </div>
        )}
      </dl>

      {summary && (
        <div className="event-popover-summary">{parse(formatHtml(summary))}</div>
      )}

      {details && (
        <div className="event-popover-details">
          <button
            type="button"
            className="event-popover-details-toggle"
            onClick={() => setShowJoinDetails((open) => !open)}
            aria-expanded={showJoinDetails}
            aria-controls={detailsId}
          >
            {showJoinDetails ? 'Hide join details' : 'Show dial-in details'}
          </button>
          {showJoinDetails && (
            <div id={detailsId} className="event-popover-details-body">
              {parse(formatHtml(details))}
            </div>
          )}
        </div>
      )}

      <div className="event-popover-actions">
        {inviteUrl && (
          <a
            className="event-popover-btn event-popover-btn-primary"
            href={inviteUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon path={mdiAccountPlus} size={0.75} aria-hidden="true" />
            Invite me
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        )}
        {locationIsJoinLink && !inviteUrl && (
          <a
            className="event-popover-btn event-popover-btn-primary"
            href={location}
            target="_blank"
            rel="noreferrer"
          >
            <Icon path={mdiOpenInNew} size={0.75} aria-hidden="true" />
            Open location
            <span className="sr-only"> (opens in new tab)</span>
          </a>
        )}
        <button
          type="button"
          className="event-popover-btn"
          onClick={() => downloadICSFile(event)}
        >
          <Icon path={mdiDownload} size={0.75} aria-hidden="true" />
          Download ICS
        </button>
      </div>
    </div>
  );
}
