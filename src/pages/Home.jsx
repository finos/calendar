import Calendar from '../components/Calendar.jsx';
import Header from '../components/Header.jsx';

export default function Home({ theme, onToggleTheme }) {
  return (
    <div className="App main">
      <header className="header-main">
        <Header theme={theme} onToggleTheme={onToggleTheme} />
      </header>
      <main className="body-main">
        <Calendar />
      </main>
    </div>
  );
}
