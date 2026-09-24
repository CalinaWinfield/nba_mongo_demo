import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import App from "./App";

const mockGames = [
  {
    _id: "game1",
    game_id: 38,
    game_date: "2026-01-09",
    home_team: { team_id: 8, team_name: "Denver Nuggets" },
    away_team: { team_id: 1, team_name: "Atlanta Hawks" },
    home_score: 60,
    away_score: 48,
    players: [
      {
        player_id: 107,
        name: "Nikola Jokic",
        team_id: 8,
        stats: { points: 34, rebounds: 13, assists: 9, steals: 1, blocks: 2, minutes: 36 },
      },
      {
        player_id: 108,
        name: "Jamal Murray",
        team_id: 8,
        stats: { points: 26, rebounds: 4, assists: 7, steals: 2, blocks: 0, minutes: 34 },
      },
      {
        player_id: 103,
        name: "Trae Young",
        team_id: 1,
        stats: { points: 28, rebounds: 3, assists: 10, steals: 1, blocks: 0, minutes: 37 },
      },
      {
        player_id: 104,
        name: "Dejounte Murray",
        team_id: 1,
        stats: { points: 20, rebounds: 6, assists: 5, steals: 1, blocks: 0, minutes: 35 },
      },
    ],
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
            mode: "mongodb",
            database: "stats",
            collection: "games",
          }),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockGames),
    });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders NBA Games & Matchups heading and matchup teams", async () => {
  render(<App />);
  const headingElement = await screen.findByText(/NBA Games & Matchups/i);
  expect(headingElement).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getAllByText("Denver Nuggets").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Atlanta Hawks").length).toBeGreaterThan(0);
  });
});

test("displays team scores and player box score", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Nikola Jokic")).toBeInTheDocument();
  });
  expect(screen.getByText("60")).toBeInTheDocument();
  expect(screen.getByText("48")).toBeInTheDocument();
  expect(screen.getByText("Trae Young")).toBeInTheDocument();
});

test("cycles sorting and arrows when clicking column header in box score", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Nikola Jokic")).toBeInTheDocument();
  });

  const getRenderedPlayers = () =>
    screen.getAllByRole("row").slice(1).map((row) => row.querySelector(".player-name").textContent);

  // Initial order is original players order
  expect(getRenderedPlayers()).toEqual([
    "Nikola Jokic",
    "Jamal Murray",
    "Trae Young",
    "Dejounte Murray",
  ]);
  expect(screen.queryByTestId("sort-arrow-points")).toBeNull();

  const ptsHeader = screen.getByRole("button", { name: /pts/i });

  // 1st click: Ascending (20, 26, 28, 34) -> Dejounte, Jamal, Trae, Nikola
  fireEvent.click(ptsHeader);
  expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▲");
  expect(getRenderedPlayers()).toEqual([
    "Dejounte Murray",
    "Jamal Murray",
    "Trae Young",
    "Nikola Jokic",
  ]);

  // 2nd click: Descending (34, 28, 26, 20) -> Nikola, Trae, Jamal, Dejounte
  fireEvent.click(ptsHeader);
  expect(screen.getByTestId("sort-arrow-points")).toHaveTextContent("▼");
  expect(getRenderedPlayers()).toEqual([
    "Nikola Jokic",
    "Trae Young",
    "Jamal Murray",
    "Dejounte Murray",
  ]);

  // 3rd click: Reset
  fireEvent.click(ptsHeader);
  expect(screen.queryByTestId("sort-arrow-points")).toBeNull();
  expect(getRenderedPlayers()).toEqual([
    "Nikola Jokic",
    "Jamal Murray",
    "Trae Young",
    "Dejounte Murray",
  ]);
});

test("switches between Game Matchups and All Players tabs", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Nikola Jokic")).toBeInTheDocument();
  });

  const playersTab = screen.getByRole("tab", { name: /all players leaderboard/i });
  fireEvent.click(playersTab);

  expect(screen.getByText(/All Players Statistics/i)).toBeInTheDocument();
  expect(screen.getByText("Opponent")).toBeInTheDocument();
});
