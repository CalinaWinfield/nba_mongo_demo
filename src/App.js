import React, { useEffect, useState, useCallback, useMemo } from 'react';
import logo from './logo.svg';
import './App.css';

function MyComp() {
  return (
    <div className="my-comp">
      <p>
        <strong>Hello, My name is Calina!</strong><br />
        Welcome to my NBA Stats Web App.
      </p>
    </div>
  );
}

const COLUMNS = [
  { key: "player", label: "Player" },
  { key: "team", label: "Team" },
  { key: "opponent", label: "Opponent" },
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "gameDate", label: "Date" },
];

async function apiFetch(endpoint) {
  try {
    const res = await fetch(endpoint, {
      headers: { "Accept": "application/json" }
    });
    if (res.ok) return res;
  } catch (_) {}
  return fetch(`http://localhost:5050${endpoint}`, {
    headers: { "Accept": "application/json" }
  });
}

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
      const [logsRes, statusRes] = await Promise.all([
        apiFetch("/api/gamelogs"),
        apiFetch("/api/status").catch(() => null),
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
        return sortConfig.direction === "asc" ? aTime - bTime : bTime - aTime;
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
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1 className="app-title">🏀 NBA Stats Database</h1>
        <MyComp />
        
        {status && (
          <div className="status-container">
            <span
              className={`status-badge ${
                status.mode === "mongodb" ? "badge-mongo" : "badge-fallback"
              }`}
            >
              {status.mode === "mongodb"
                ? `🟢 Connected to MongoDB (${status.database}.${status.collection})`
                : "🟡 In-Memory Fallback Mode"}
            </span>
          </div>
        )}
      </header>

      <main className="App-main">
        <section className="stats-section">
          <div className="section-header">
            <h2>Recent NBA Game Logs</h2>
            <button className="btn-refresh" onClick={fetchData}>
              🔄 Refresh
            </button>
          </div>

          {loading && (
            <div className="loading-card">
              <div className="spinner"></div>
              <p>Loading NBA game logs...</p>
            </div>
          )}

          {error && !loading && (
            <div className="error-card">
              <p><strong>❌ Error:</strong> {error}</p>
              <p className="error-hint">
                Ensure backend API is running on port 5050.
              </p>
              <button className="btn-retry" onClick={fetchData}>
                Retry Connection
              </button>
            </div>
          )}

          {!loading && !error && (
            <div className="table-card">
              <table className="stats-table">
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
                          onClick={() => handleSort(col.key)}
                          className="sortable-th"
                          title={`Sort by ${col.label}`}
                        >
                          <span className="th-content">
                            <span>{col.label}</span>
                            <span className="sort-arrow-slot">
                              {arrow && <span className="sort-arrow">{arrow}</span>}
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
                      <td colSpan={COLUMNS.length} className="empty-cell">
                        No game logs found in database.
                      </td>
                    </tr>
                  ) : (
                    sortedLogs.map((log) => (
                      <tr key={log._id}>
                        <td className="player-col">
                          <strong>{log.player}</strong>
                        </td>
                        <td>
                          <span className="team-pill">{log.team}</span>
                        </td>
                        <td>{log.opponent}</td>
                        <td className="pts-col">
                          <strong>{log.points}</strong>
                        </td>
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
          )}
        </section>
      </main>

      <footer className="App-footer">
        <p>NBA Stats Web App &bull; Powered by React 19, Express &amp; MongoDB Atlas</p>
      </footer>
    </div>
  );
}

export default App;