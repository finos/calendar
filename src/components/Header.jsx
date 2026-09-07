import {
  mdiContentCopy,
  mdiOpenInNew,
  mdiRss,
  mdiWeatherNight,
  mdiWhiteBalanceSunny,
} from '@mdi/js';
import Icon from '@mdi/react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import '../styles/Header.css';

const LFX_CALENDAR_URL =
  'https://zoom-lfx.platform.linuxfoundation.org/meetings/finos?view=month';

const SUBSCRIBE_HINT =
  'Copy the ICS URL and add it to Outlook, Google Calendar, or Apple Calendar.';

export default function Header({ theme, onToggleTheme }) {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);

  const copySubscribeLink = useCallback(async () => {
    const url = `${window.location.origin}/calendar.ics`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this subscribe URL:', url);
    }
  }, []);

  return (
    <div className="content header-bar">
      <h1 className="logo">
        <Link to="/" className="logo-link">
          FINOS Event Calendar
        </Link>
      </h1>
      <div className="header-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Icon
            path={isDark ? mdiWhiteBalanceSunny : mdiWeatherNight}
            size={0.9}
            aria-hidden="true"
          />
          {isDark ? 'Light' : 'Dark'}
        </button>
        <a
          className="subscribe-link"
          href={LFX_CALENDAR_URL}
          target="_blank"
          rel="noreferrer"
          title="Open the LFX Meetings calendar"
        >
          <Icon path={mdiOpenInNew} size={0.8} aria-hidden="true" />
          LFX calendar
          <span className="sr-only"> (opens in new tab)</span>
        </a>
        <button
          type="button"
          className="subscribe-link"
          onClick={copySubscribeLink}
          title={SUBSCRIBE_HINT}
          aria-label={copied ? 'Subscribe link copied' : 'Copy calendar subscribe link'}
        >
          <Icon path={copied ? mdiContentCopy : mdiRss} size={0.8} aria-hidden="true" />
          {copied ? 'Copied!' : 'Copy subscribe link'}
        </button>
      </div>
    </div>
  );
}
