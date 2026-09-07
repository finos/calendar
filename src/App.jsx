import { Route, Routes } from 'react-router-dom';

import useTheme from './hooks/useTheme.js';
import Home from './pages/Home.jsx';
import WeeklyView from './pages/WeeklyView.jsx';

export default function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Routes>
      <Route
        path="/"
        element={<Home theme={theme} onToggleTheme={toggleTheme} />}
      />
      <Route path="/weekly-view" element={<WeeklyView />} />
    </Routes>
  );
}
