import React from 'react';
import '../styles/App.css';
import Calendar from '../components/Calendar';
import Header from '../components/Header';

function App() {
  return (
    <div className="App main">
      <header className="header-main">
        <Header />
      </header>
      <main className="body-main">
        <Calendar />
      </main>
    </div>
  );
}

export default App;
