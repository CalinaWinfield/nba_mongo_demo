import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (String(url).includes('/api/status')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'ok', mode: 'mongodb' })
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([
        { _id: '1', player: 'LeBron James', team: 'LAL', opponent: 'BOS', points: 30, rebounds: 8, assists: 8, gameDate: '2026-04-01' }
      ])
    });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('renders Calina greeting and NBA Stats header', async () => {
  render(<App />);
  const headingElement = screen.getByText(/Hello, My name is Calina!/i);
  expect(headingElement).toBeInTheDocument();
  const titleElement = screen.getByText(/NBA Stats Database/i);
  expect(titleElement).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.queryByText(/Loading NBA game logs/i)).not.toBeInTheDocument();
  });
});

test('starts with no columns sorted, and clicking a column toggles sorting with arrow without widening', async () => {
  render(<App />);

  // Wait for table to load
  const ptsHeader = await screen.findByTitle('Sort by PTS');
  expect(ptsHeader).toBeInTheDocument();

  // Check that no sort arrows exist initially
  const initialArrows = screen.queryAllByText(/^[▲▼]$/);
  expect(initialArrows).toHaveLength(0);

  // Click on "PTS" column header
  fireEvent.click(ptsHeader);

  // An arrow should now appear inside PTS
  const arrowAfterClick = screen.getByText('▲');
  expect(arrowAfterClick).toBeInTheDocument();

  // Click again for descending
  fireEvent.click(ptsHeader);
  const arrowAfterSecondClick = screen.getByText('▼');
  expect(arrowAfterSecondClick).toBeInTheDocument();

  // Click again for unsorted
  fireEvent.click(ptsHeader);
  expect(screen.queryByText(/^[▲▼]$/)).toBeNull();
});
