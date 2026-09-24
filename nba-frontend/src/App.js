// src/App.js
import { useEffect, useState, useCallback, useMemo } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ALL_PLAYERS_COLUMNS = [
  { key: "player", label: "Player" },
  { key: "team", label: "Team" },
  { key: "opponent", label: "Opponent" },
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "steals", label: "STL" },
  { key: "blocks", label: "BLK" },
  { key: "minutes", label: "MIN" },
  { key: "game_date", label: "Date" },
];

const GAME_BOXSCORE_COLUMNS = [
  { key: "player", label: "Player" },
  { key: "team", label: "Team" },
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "steals", label: "STL" },
  { key: "blocks", label: "BLK" },
  { key: "minutes", label: "MIN" },
];

/**
 * Calculates next sort configuration on click: asc -> desc -> reset (null)
 */
function getNextSortConfig(prev, key) {
  if (prev.key !== key) {
    return { key, direction: "asc" };
  }
  if (prev.direction === "asc") {
    return { key, direction: "desc" };
  }
  if (prev.direction === "desc") {
    return { key: null, direction: null };
  }
  return { key, direction: "asc" };
}

/**
 * Sorts array of records based on sort configuration
 */
function sortRecords(items, sortConfig) {
  if (!sortConfig || !sortConfig.key || !sortConfig.direction) {
    return items;
  }

  return [...items].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (sortConfig.key === "game_date" || sortConfig.key === "gameDate") {
      const aTime = new Date(aVal).getTime();
      const bTime = new Date(bVal).getTime();
      if (aTime < bTime) return sortConfig.direction === "asc" ? -1 : 1;
      if (aTime > bTime) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    const strA = String(aVal).toLowerCase();
    const strB = String(bVal).toLowerCase();
    if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
    if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}

/**
 * Reusable sortable table header component that reflects only its own table's sort state
 */
function SortableTableHeader({ columns, sortConfig, onSort }) {
  return (
    <thead>
      <tr>
        {columns.map((col) => {
          const isSorted = sortConfig && sortConfig.key === col.key;
          const arrow = isSorted
            ? sortConfig.direction === "asc"
              ? "▲"
              : sortConfig.direction === "desc"
              ? "▼"
              : null
            : null;

          return (
            <th
              key={col.key}
              className="sortable"
              onClick={() => onSort(col.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSort(col.key);
                }
              }}
              tabIndex={0}
              role="button"
              aria-sort={
                isSorted
                  ? sortConfig.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
              }
              title={`Sort by ${col.label}`}
            >
              <span className="th-content">
                <span>{col.label}</span>
                <span className="sort-arrow-slot">
                  {arrow && (
                    <span
                      className="sort-arrow"
                      data-testid={`sort-arrow-${col.key}`}
                      aria-hidden="true"
                    >
                      {arrow}
                    </span>
                  )}
                </span>
              </span>
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

/**
 * Individual Game Card with its own isolated table sorting state
 */
function GameCard({ game }) {
  // Each game card maintains its own independent sort configuration
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const homeTeam = game.home_team || {};
  const awayTeam = game.away_team || {};

  // Display actual team score from database
  const homeScore =
    homeTeam.team_score ??
    game.home_score ??
    (game.players || []).reduce(
      (sum, p) => (p.team_id === homeTeam.team_id ? sum + (p.stats?.points || 0) : sum),
      0
    );

  const awayScore =
    awayTeam.team_score ??
    game.away_score ??
    (game.players || []).reduce(
      (sum, p) => (p.team_id === awayTeam.team_id ? sum + (p.stats?.points || 0) : sum),
      0
    );

  const gamePlayers = useMemo(() => {
    return (game.players || []).map((p) => ({
      _id: p.player_id,
      player_id: p.player_id,
      player: p.name,
      team: p.team_id === homeTeam.team_id ? homeTeam.team_name : awayTeam.team_name,
      points: p.stats?.points ?? 0,
      rebounds: p.stats?.rebounds ?? 0,
      assists: p.stats?.assists ?? 0,
      steals: p.stats?.steals ?? 0,
      blocks: p.stats?.blocks ?? 0,
      minutes: p.stats?.minutes ?? 0,
    }));
  }, [game, homeTeam, awayTeam]);

  const sortedGamePlayers = useMemo(() => {
    return sortRecords(gamePlayers, sortConfig);
  }, [gamePlayers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => getNextSortConfig(prev, key));
  };

  return (
    <div className="game-card">
      {/* Game Scoreboard Header */}
      <div className="scoreboard-header">
        <div className="game-meta">
          <span className="game-badge">Game #{game.game_id}</span>
          <span className="game-date">
            📅 {new Date(game.game_date + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="matchup-banner">
          <div className="team-box away">
            <span className="team-role">AWAY</span>
            <h2 className="team-title">{awayTeam.team_name}</h2>
            <span className="team-score">{awayScore}</span>
          </div>

          <div className="vs-divider">
            <span className="vs-pill">@</span>
            <span className="final-label">FINAL</span>
          </div>

          <div className="team-box home">
            <span className="team-role">HOME</span>
            <h2 className="team-title">{homeTeam.team_name}</h2>
            <span className="team-score">{homeScore}</span>
          </div>
        </div>
      </div>

      {/* Game Box Score Table */}
      <div className="boxscore-section">
        <h3 className="section-title">📊 Box Score</h3>
        <div className="table-wrapper">
          <table>
            <SortableTableHeader
              columns={GAME_BOXSCORE_COLUMNS}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
            <tbody>
              {sortedGamePlayers.map((player) => (
                <tr key={player._id}>
                  <td className="player-name">{player.player}</td>
                  <td>
                    <span className="team-pill">{player.team}</span>
                  </td>
                  <td className="points-highlight">{player.points}</td>
                  <td>{player.rebounds}</td>
                  <td>{player.assists}</td>
                  <td>{player.steals}</td>
                  <td>{player.blocks}</td>
                  <td>{player.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [games, setGames] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View state: 'matchups' or 'players'
  const [activeTab, setActiveTab] = useState("matchups");
  const [selectedGameFilter, setSelectedGameFilter] = useState("all");

  // Independent sorting state for the All Players Leaderboard table
  const [leaderboardSortConfig, setLeaderboardSortConfig] = useState({
    key: null,
    direction: null,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Parallel fetch for games & server status
      const [gamesRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/games`).catch(() => null),
        fetch(`${API_URL}/api/status`).catch(() => null),
      ]);

      let loadedGames = [];

      if (gamesRes && gamesRes.ok) {
        loadedGames = await gamesRes.json();
      } else {
        // Fallback to /api/gamelogs if /api/games isn't available
        const logsRes = await fetch(`${API_URL}/api/gamelogs`);
        if (!logsRes.ok) {
          throw new Error(`Server returned HTTP ${logsRes.status}`);
        }
        const logsData = await logsRes.json();
        if (Array.isArray(logsData) && logsData[0]?.home_team) {
          loadedGames = logsData;
        } else {
          // Wrap flat logs in synthetic game representation
          loadedGames = [
            {
              _id: "legacy_game",
              game_id: 1,
              game_date: logsData[0]?.gameDate || "2026-01-01",
              home_team: { team_id: 1, team_name: "Home Team" },
              away_team: { team_id: 2, team_name: "Away Team" },
              players: logsData.map((l, idx) => ({
                player_id: idx + 1,
                name: l.player || l.name,
                team_id: 1,
                stats: {
                  points: l.points ?? 0,
                  rebounds: l.rebounds ?? 0,
                  assists: l.assists ?? 0,
                  steals: l.steals ?? 0,
                  blocks: l.blocks ?? 0,
                  minutes: l.minutes ?? 0,
                },
              })),
            },
          ];
        }
      }

      setGames(loadedGames);

      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch data from API");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLeaderboardSort = (key) => {
    setLeaderboardSortConfig((prev) => getNextSortConfig(prev, key));
  };

  // Flatten games into individual player records for leaderboard
  const allPlayers = useMemo(() => {
    const list = [];
    games.forEach((game) => {
      const homeTeam = game.home_team || {};
      const awayTeam = game.away_team || {};

      (game.players || []).forEach((p) => {
        const isHome = p.team_id === homeTeam.team_id;
        const team = isHome ? homeTeam.team_name : awayTeam.team_name;
        const opponent = isHome ? awayTeam.team_name : homeTeam.team_name;

        list.push({
          _id: `${game.game_id || game._id}_${p.player_id}`,
          game_id: game.game_id,
          game_date: game.game_date,
          player_id: p.player_id,
          player: p.name,
          team: team || "N/A",
          opponent: opponent || "N/A",
          is_home: isHome,
          points: p.stats?.points ?? 0,
          rebounds: p.stats?.rebounds ?? 0,
          assists: p.stats?.assists ?? 0,
          steals: p.stats?.steals ?? 0,
          blocks: p.stats?.blocks ?? 0,
          minutes: p.stats?.minutes ?? 0,
        });
      });
    });
    return list;
  }, [games]);

  // Filtered games based on dropdown selection
  const filteredGames = useMemo(() => {
    if (selectedGameFilter === "all") return games;
    return games.filter((g) => String(g.game_id) === String(selectedGameFilter));
  }, [games, selectedGameFilter]);

  // Sorted players for All Players tab
  const sortedLeaderboardPlayers = useMemo(() => {
    return sortRecords(allPlayers, leaderboardSortConfig);
  }, [allPlayers, leaderboardSortConfig]);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <div>
          <h1 className="title">🏀 NBA Games & Matchups</h1>
          <p className="subtitle">
            Live box scores & player stats from MongoDB <code>{status?.database || "stats"}.{status?.collection || "games"}</code>
          </p>
        </div>
        {status && (
          <span
            className={`status-badge ${
              status.mode === "mongodb" ? "live" : "demo"
            }`}
          >
            {status.mode === "mongodb"
              ? `🟢 Live MongoDB (${status.database}.${status.collection})`
              : "🟡 Demo Mode (In-Memory)"}
          </span>
        )}
      </header>

      {/* Demo Mode Notice */}
      {status && status.mode === "fallback" && (
        <div className="banner">
          <strong>Demo Mode Active:</strong> Displaying sample NBA games from memory.
          To connect to your live MongoDB cluster, ensure <code>MONGODB_URI</code> in{" "}
          <code>.env</code> is active and restart the server.
        </div>
      )}

      {/* Navigation Controls & Filters */}
      <div className="controls-bar">
        <div className="tab-group" role="tablist">
          <button
            className={`tab-btn ${activeTab === "matchups" ? "active" : ""}`}
            onClick={() => setActiveTab("matchups")}
            role="tab"
            aria-selected={activeTab === "matchups"}
          >
            🏀 Game Matchups ({games.length})
          </button>
          <button
            className={`tab-btn ${activeTab === "players" ? "active" : ""}`}
            onClick={() => setActiveTab("players")}
            role="tab"
            aria-selected={activeTab === "players"}
          >
            👤 All Players Leaderboard ({allPlayers.length})
          </button>
        </div>

        {activeTab === "matchups" && games.length > 1 && (
          <div className="filter-group">
            <label htmlFor="game-filter">Filter Game:</label>
            <select
              id="game-filter"
              value={selectedGameFilter}
              onChange={(e) => setSelectedGameFilter(e.target.value)}
              className="game-select"
            >
              <option value="all">All Matchups ({games.length})</option>
              {games.map((g) => (
                <option key={g.game_id || g._id} value={g.game_id}>
                  Game #{g.game_id}: {g.away_team?.team_name} @ {g.home_team?.team_name} ({g.game_date})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="card loading-container">
          <div className="spinner" />
          <p>Loading NBA games & box scores...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="error-box">
          <p style={{ margin: "0 0 0.75rem 0", fontWeight: "600" }}>
            ❌ Error connecting to backend API:
          </p>
          <p style={{ margin: "0 0 1rem 0" }}>{error}</p>
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.85rem", color: "#7f1d1d" }}>
            Make sure the backend is running at <code>{API_URL}</code>. Run{" "}
            <code>npm run server</code> or <code>npm run dev</code> in the project root.
          </p>
          <button className="btn" onClick={fetchData}>
            Retry Connection
          </button>
        </div>
      )}

      {/* View: Game Matchups & Box Scores */}
      {!loading && !error && activeTab === "matchups" && (
        <div className="games-container">
          {filteredGames.length === 0 ? (
            <div className="card empty-state">No games found.</div>
          ) : (
            filteredGames.map((game) => (
              <GameCard key={game.game_id || game._id} game={game} />
            ))
          )}
        </div>
      )}

      {/* View: All Players Leaderboard */}
      {!loading && !error && activeTab === "players" && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">👤 All Players Statistics</h2>
            <p className="card-subtitle">
              Comprehensive player stats across all recorded games. Click any column header to sort.
            </p>
          </div>
          <div className="table-wrapper">
            <table>
              <SortableTableHeader
                columns={ALL_PLAYERS_COLUMNS}
                sortConfig={leaderboardSortConfig}
                onSort={handleLeaderboardSort}
              />
              <tbody>
                {sortedLeaderboardPlayers.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: "center", padding: "2rem" }}>
                      No player statistics found.
                    </td>
                  </tr>
                ) : (
                  sortedLeaderboardPlayers.map((log) => (
                    <tr key={log._id}>
                      <td className="player-name">{log.player}</td>
                      <td>
                        <span className="team-pill">{log.team}</span>
                      </td>
                      <td>{log.opponent}</td>
                      <td className="points-highlight">{log.points}</td>
                      <td>{log.rebounds}</td>
                      <td>{log.assists}</td>
                      <td>{log.steals}</td>
                      <td>{log.blocks}</td>
                      <td>{log.minutes}</td>
                      <td>
                        {log.game_date
                          ? new Date(log.game_date + "T00:00:00").toLocaleDateString()
                          : "N/A"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;