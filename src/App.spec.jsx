import { vi } from 'vitest';
import FullCalendar from '@fullcalendar/react';
import { render } from '@testing-library/react';
import App from './App';

const mockFullCalendar = vi.fn(() => {
  return FullCalendar;
});

vi.spyOn(mockFullCalendar);

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders calendar', () => {
    render(<App />);
    expect(mockFullCalendar).toHaveBeenCalled();
  });

  it('true is truthy', () => {
    expect(true).toBe(true);
  });

  it('false is falsy', () => {
    expect(false).toBe(false);
  });
});
