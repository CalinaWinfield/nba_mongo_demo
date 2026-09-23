// src/App.js
import { useEffect, useState, useCallback, useMemo } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const COLUMNS = [
  { key: "player", label: "Player" },
  { key: "team", label: "Team" },
  { key: "opponent", label: "Opponent" },
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "gameDate", label: "Date" },
];

function App() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch game logs and server status in parallel
      const [logsRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/api/gamelogs`),
        fetch(`${API_URL}/api/status`).catch(() => null),
      ]);

      if (!logsRes.ok) {
        throw new Error(`Server returned HTTP ${logsRes.status}`);
      }

      const logsData = await logsRes.json();
      setLogs(logsData);

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

  const handleSort = (key) => {
    setSortConfig((prev) => {
      // 1st click on new column -> ascending
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      // 1st click on same column was asc -> 2nd click: descending
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      // 2nd click on same column was desc -> 3rd click: reset (no sort)
      if (prev.direction === "desc") {
        return { key: null, direction: null };
      }
      return { key, direction: "asc" };
    });
  };

  const sortedLogs = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return logs;
    }

    return [...logs].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (sortConfig.key === "gameDate") {
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
  }, [logs, sortConfig]);

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">🏀 Recent NBA Game Logs</h1>
        {status && (
          <span
            className={`status-badge ${
              status.mode === "mongodb" ? "live" : "demo"
            }`}
          >
            {status.mode === "mongodb"
              ? "🟢 Connected to MongoDB"
              : "🟡 Demo Mode (In-Memory)"}
          </span>
        )}
      </header>

      {status && status.mode === "fallback" && (
        <div className="banner">
          <strong>Demo Mode Active:</strong> Showing 10 sample game logs from
          memory. To connect to a live database, update <code>MONGODB_URI</code>{" "}
          in your <code>.env</code> file and restart the server.
        </div>
      )}

      {loading && (
        <div className="card loading-container">
          <div className="spinner" />
          <p>Loading NBA game logs...</p>
        </div>
      )}

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

      {!loading && !error && (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {COLUMNS.map((col) => {
                    const isSorted = sortConfig.key === col.key;
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
                        onClick={() => handleSort(col.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleSort(col.key);
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
              <tbody>
                {sortedLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                      No game logs found.
                    </td>
                  </tr>
                ) : (
                  sortedLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="player-name">{log.player}</td>
                      <td>
                        <span className="team-pill">{log.team}</span>
                      </td>
                      <td>{log.opponent}</td>
                      <td className="points-highlight">{log.points}</td>
                      <td>{log.rebounds}</td>
                      <td>{log.assists}</td>
                      <td>
                        {log.gameDate
                          ? new Date(log.gameDate).toLocaleDateString()
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