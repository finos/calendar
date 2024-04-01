import { vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders calendar', async () => {
    render(<App />);
    const app = await screen.findAllByTestId('finos-calendar');
    expect(app[0]).toBeTruthy();
  });
});
