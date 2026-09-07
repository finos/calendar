import { lazy, Suspense } from 'react';

import Header from '../components/Header.jsx';

const Calendar = lazy(() => import('../components/Calendar.jsx'));

export default function Home({ theme, onToggleTheme }) {
  return (
    <div className="App main">
      <header className="header-main">
        <Header theme={theme} onToggleTheme={onToggleTheme} />
      </header>
      <main className="body-main">
        <Suspense
          fallback={
            <div className="content finos-calendar">
              <p className="calendar-loading-inline" role="status" aria-live="polite">
                <span className="finos-calendar-spinner" aria-hidden="true" />
                Loading calendar…
              </p>
            </div>
          }
        >
          <Calendar />
        </Suspense>
      </main>
    </div>
  );
}
