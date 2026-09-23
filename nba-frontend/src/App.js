// src/App.js
import { useEffect, useState, useCallback } from "react";
import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                  <th>Player</th>
                  <th>Team</th>
                  <th>Opponent</th>
                  <th>PTS</th>
                  <th>REB</th>
                  <th>AST</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                      No game logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
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