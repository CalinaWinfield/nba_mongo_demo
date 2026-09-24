import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import App from "./App";

const mockGames = [
  {
    _id: "game1",
    game_id: 38,
    game_date: "2026-01-09",
    home_team: { team_id: 8, team_name: "Denver Nuggets", team_score: 87 },
    away_team: { team_id: 1, team_name: "Atlanta Hawks", team_score: 110 },
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
  {
    _id: "game2",
    game_id: 41,
    game_date: "2026-01-15",
    home_team: { team_id: 3, team_name: "San Antonio Spurs", team_score: 119 },
    away_team: { team_id: 9, team_name: "Milwaukee Bucks", team_score: 101 },
    players: [
      {
        player_id: 105,
        name: "Victor Wembanyama",
        team_id: 3,
        stats: { points: 31, rebounds: 11, assists: 4, steals: 1, blocks: 3, minutes: 33 },
      },
      {
        player_id: 109,
        name: "Giannis Antetokounmpo",
        team_id: 9,
        stats: { points: 35, rebounds: 12, assists: 5, steals: 1, blocks: 1, minutes: 36 },
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

test("displays actual team scores and player box score", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Nikola Jokic")).toBeInTheDocument();
  });
  // Actual team scores from database
  expect(screen.getByText("87")).toBeInTheDocument();
  expect(screen.getByText("110")).toBeInTheDocument();
  expect(screen.getByText("119")).toBeInTheDocument();
  expect(screen.getByText("101")).toBeInTheDocument();
  expect(screen.getByText("Trae Young")).toBeInTheDocument();
  expect(screen.getByText("Victor Wembanyama")).toBeInTheDocument();
});

test("cycles sorting and arrows when clicking column header in box score", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Nikola Jokic")).toBeInTheDocument();
  });

  const tables = screen.getAllByRole("table");
  const firstTable = tables[0];

  const getRenderedPlayers = () =>
    within(firstTable)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector(".player-name").textContent);

  // Initial order is original players order
  expect(getRenderedPlayers()).toEqual([
    "Nikola Jokic",
    "Jamal Murray",
    "Trae Young",
    "Dejounte Murray",
  ]);
  expect(within(firstTable).queryByTestId("sort-arrow-points")).toBeNull();

  const ptsHeader = within(firstTable).getByRole("button", { name: /pts/i });

  // 1st click: Ascending (20, 26, 28, 34) -> Dejounte, Jamal, Trae, Nikola
  fireEvent.click(ptsHeader);
  expect(within(firstTable).getByTestId("sort-arrow-points")).toHaveTextContent("▲");
  expect(getRenderedPlayers()).toEqual([
    "Dejounte Murray",
    "Jamal Murray",
    "Trae Young",
    "Nikola Jokic",
  ]);

  // 2nd click: Descending (34, 28, 26, 20) -> Nikola, Trae, Jamal, Dejounte
  fireEvent.click(ptsHeader);
  expect(within(firstTable).getByTestId("sort-arrow-points")).toHaveTextContent("▼");
  expect(getRenderedPlayers()).toEqual([
    "Nikola Jokic",
    "Trae Young",
    "Jamal Murray",
    "Dejounte Murray",
  ]);

  // 3rd click: Reset
  fireEvent.click(ptsHeader);
  expect(within(firstTable).queryByTestId("sort-arrow-points")).toBeNull();
  expect(getRenderedPlayers()).toEqual([
    "Nikola Jokic",
    "Jamal Murray",
    "Trae Young",
    "Dejounte Murray",
  ]);
});

test("sorting one table does not affect other tables on the page", async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText("Nikola Jokic")).toBeInTheDocument();
    expect(screen.getByText("Victor Wembanyama")).toBeInTheDocument();
  });

  const tables = screen.getAllByRole("table");
  expect(tables.length).toBe(2);

  const table1 = tables[0];
  const table2 = tables[1];

  const getTable2Players = () =>
    within(table2)
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelector(".player-name").textContent);

  // Table 2 initially has Victor (31) then Giannis (35)
  expect(getTable2Players()).toEqual(["Victor Wembanyama", "Giannis Antetokounmpo"]);
  expect(within(table2).queryByTestId("sort-arrow-points")).toBeNull();

  // Click PTS header on Table 1
  const table1PtsHeader = within(table1).getByRole("button", { name: /pts/i });
  fireEvent.click(table1PtsHeader);

  // Table 1 now has sort arrow ▲
  expect(within(table1).getByTestId("sort-arrow-points")).toHaveTextContent("▲");

  // Table 2 MUST NOT have any sort arrow and its rows must remain unchanged
  expect(within(table2).queryByTestId("sort-arrow-points")).toBeNull();
  expect(getTable2Players()).toEqual(["Victor Wembanyama", "Giannis Antetokounmpo"]);
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
