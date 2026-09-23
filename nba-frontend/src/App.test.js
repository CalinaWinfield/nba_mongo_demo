import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "./App";

const mockLogs = [
  {
    _id: "1",
    player: "LeBron James",
    team: "LAL",
    opponent: "GSW",
    points: 32,
    rebounds: 8,
    assists: 11,
    gameDate: "2026-03-01T00:00:00.000Z",
  },
  {
    _id: "2",
    player: "Stephen Curry",
    team: "GSW",
    opponent: "LAL",
    points: 41,
    rebounds: 5,
    assists: 6,
    gameDate: "2026-03-02T00:00:00.000Z",
  },
  {
    _id: "3",
    player: "Nikola Jokic",
    team: "DEN",
    opponent: "PHX",
    points: 27,
    rebounds: 14,
    assists: 9,
    gameDate: "2026-02-28T00:00:00.000Z",
  },
];

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
      json: () => Promise.resolve(mockLogs),
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
  expect(screen.getAllByText("LAL").length).toBeGreaterThan(0);
  expect(screen.getByText("32")).toBeInTheDocument();
});

test("cycles sorting and arrows when clicking column header: asc (up) -> desc (down) -> none", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
  });

  const getRenderedPlayers = () =>
    screen.getAllByRole("row").slice(1).map((row) => row.querySelector(".player-name").textContent);

  // Initial order is original mockLogs order
  expect(getRenderedPlayers()).toEqual(["LeBron James", "Stephen Curry", "Nikola Jokic"]);
  expect(screen.queryByTestId("sort-arrow-player")).toBeNull();

  const playerHeader = screen.getByRole("button", { name: /player/i });

  // 1st click: Ascending (up arrow ▲)
  fireEvent.click(playerHeader);
  const upArrow = screen.getByTestId("sort-arrow-player");
  expect(upArrow).toHaveTextContent("▲");
  expect(getRenderedPlayers()).toEqual(["LeBron James", "Nikola Jokic", "Stephen Curry"]);

  // 2nd click: Descending (down arrow ▼)
  fireEvent.click(playerHeader);
  const downArrow = screen.getByTestId("sort-arrow-player");
  expect(downArrow).toHaveTextContent("▼");
  expect(getRenderedPlayers()).toEqual(["Stephen Curry", "Nikola Jokic", "LeBron James"]);

  // 3rd click: Reset (no arrow)
  fireEvent.click(playerHeader);
  expect(screen.queryByTestId("sort-arrow-player")).toBeNull();
  expect(getRenderedPlayers()).toEqual(["LeBron James", "Stephen Curry", "Nikola Jokic"]);
});

test("sorts numerical column (PTS) ascending, descending, and resets", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("LeBron James")).toBeInTheDocument();
  });

  const getRenderedPoints = () =>
    screen.getAllByRole("row").slice(1).map((row) => row.querySelector(".points-highlight").textContent);

  const ptsHeader = screen.getByRole("button", { name: /pts/i });

  // 1st click: Ascending (27, 32, 41)
  fireEvent.click(ptsHeader);
  expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▲");
  expect(getRenderedPoints()).toEqual(["27", "32", "41"]);

  // 2nd click: Descending (41, 32, 27)
  fireEvent.click(ptsHeader);
  expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▼");
  expect(getRenderedPoints()).toEqual(["41", "32", "27"]);

  // 3rd click: Reset (32, 41, 27)
  fireEvent.click(ptsHeader);
  expect(screen.queryByTestId("sort-arrow-points")).toBeNull();
  expect(getRenderedPoints()).toEqual(["32", "41", "27"]);
});
