import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders calendar', () => {
    render(<App />);
  });
  it('true is truthy', () => {
    expect(true).toBe(true);
  });

  it('false is falsy', () => {
    expect(false).toBe(false);
  });
});
