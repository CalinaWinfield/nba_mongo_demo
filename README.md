# 🏀 NBA Stats Web App

A full-stack NBA statistics application built with **React 19**, **Express**, and **MongoDB Atlas** (with automatic in-memory fallback).

---

## ✨ Features

- **Welcome Greeting**: Calina's personalized component (`MyComp`) welcoming visitors to the NBA Stats Web App.
- **Live MongoDB Atlas Integration**: Connects directly to the `nba_stats` database and streams game logs from the `game_logs` collection.
- **Interactive Stats Table**:
  - Displays player performance: Points (PTS), Rebounds (REB), Assists (AST), Player, Team, Opponent, and Game Date.
  - **Initial Unsorted State**: When the page loads, logs display in their natural database order without pre-applied sorting.
  - **3-State Sorting**: Clicking any column header toggles between `Ascending (▲)` ➔ `Descending (▼)` ➔ `Unsorted`.
  - **No Column Widening**: Column headers feature a fixed-width sort arrow slot (`.sort-arrow-slot`) so showing or toggling the arrow never causes column widths to shift.
- **Connection Status Badge**: Displays live status (`🟢 Connected to MongoDB` or `🟡 In-Memory Fallback Mode`).
- **Resilient Fallback**: Automatically serves realistic NBA sample game logs if MongoDB Atlas is offline or credentials are not configured.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```
*(On Windows PowerShell with restricted execution policies, use `npm.cmd install`)*

### 2. Run the Application
In the project root directory, run:
```bash
npm start
```
*(or `npm.cmd start`)*

This concurrently starts:
- **Frontend App**: [http://localhost:7070](http://localhost:7070)
- **Backend API**: [http://localhost:5050](http://localhost:5050)

Open **[http://localhost:7070](http://localhost:7070)** in your browser to view the application!

---

## 🛠 Available Scripts

In the project root, you can run:

| Command | Description |
| :--- | :--- |
| `npm start` | Runs both backend API (port 5050) and React frontend (port 7070) concurrently |
| `npm run client` | Starts the React frontend development server only (port 7070) |
| `npm run server` | Starts the Express MongoDB API server only (port 5050) |
| `npm run build` | Builds the React frontend into static files in `build/` |
| `npm test` | Runs the automated test suite (`src/App.test.js`) |

---

## 🔌 API Endpoints

The Express backend runs on port 5050 and is proxied through the frontend at port 7070 via `src/setupProxy.js`:

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Health check & database connection mode (`mongodb` or `fallback`) |
| `/api/gamelogs` | `GET` | Returns list of game logs sorted by date (supports `?limit=N`) |
| `/api/gamelogs/:id` | `GET` | Returns a single game log by document `_id` |

---

## 💾 Environment Configuration

Configuration is managed in the `.env` file at the project root:

```env
PORT=7070
API_PORT=5050
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?appName=nbaStats
```

- `PORT`: Port for the React development server (configured to **7070**).
- `API_PORT`: Port for the Express API server (configured to **5050**).
- `MONGODB_URI`: MongoDB Atlas connection string. If missing or unreachable, the server automatically runs in demo fallback mode.

---

## 📂 Project Structure

```text
nba-stats-db/
├── .env                # Port and MongoDB Atlas configuration
├── package.json        # Dependencies, scripts, and proxy settings
├── server.js           # Express API server & MongoDB Atlas connector
├── public/
│   ├── index.html      # HTML template (titled "NBA Stats Web App")
│   └── favicon.ico     # Application icon
└── src/
    ├── App.js          # Main application component & sortable table
    ├── App.css         # Styling for header, badges, and fixed-slot table
    ├── App.test.js     # Automated tests for header, greeting, and sorting
    ├── index.js        # React 19 application entry point
    ├── logo.svg        # Spinning React logo asset
    ├── setupProxy.js   # http-proxy-middleware proxying /api to port 5050
    └── setupTests.js   # Testing library configuration
```

---

## 💡 Troubleshooting

### PowerShell Script Execution Policy (Windows)
If you see the error:
```text
File ... npm.ps1 cannot be loaded because running scripts is disabled on this system
```
Use `npm.cmd` instead of `npm`:
```powershell
npm.cmd start
```
Or allow script execution for your user session:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```