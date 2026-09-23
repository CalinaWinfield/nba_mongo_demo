import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (String(url).includes("/api/status")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "ok",
            mode: "fallback",
            database: "nba_stats",
          }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            _id: "1",
            player: "LeBron James",
            team: "LAL",
            opponent: "GSW",
            points: 32,
            rebounds: 8,
            assists: 11,
            gameDate: new Date().toISOString(),
          },
        ]),
    });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders NBA Game Logs heading", async () => {
  render(<App />);
  const headingElement = await screen.findByText(/Recent NBA Game Logs/i);
  expect(headingElement).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
  });
});

test("displays game logs after fetching", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
  });
  expect(screen.getByText("LAL")).toBeInTheDocument();
  expect(screen.getByText("32")).toBeInTheDocument();
});
