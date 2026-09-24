# 🏀 NBA Stats & Games MongoDB Demo

A full-stack demonstration application showing how to store, query, and visualize **NBA Games, Matchup Scoreboards, and Player Box Scores** using **Express**, **MongoDB** (with automatic in-memory demo fallback), and **React**.

---

## ⚡ Quick Start

### 1. Install Dependencies
Run in the root directory:
```bash
npm install
cd nba-frontend && npm install && cd ..
```

### 2. Run Both Backend & Frontend
Start both the Express API and the React frontend concurrently:
```bash
npm run dev
```
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Frontend App**: [http://localhost:3000](http://localhost:3000)

---

## 💾 Database Configuration

The application connects to **MongoDB Atlas** (or local MongoDB) and includes an **automatic in-memory fallback mode** if no database connection is configured or reachable.

### Environment Variables (`.env`)
Create a `.env` file in the root directory (based on `.env.example`):
```env
# MongoDB Connection String (Atlas cluster or local instance)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?appName=nbaGames

# Database & Collection (defaults to 'stats' and 'games')
DB_NAME=stats
COLLECTION=games

# Backend Server Port (defaults to 5000)
PORT=5000
```

### Data Schema (`stats.games`)
Each document in the `games` collection models a full NBA matchup:
```json
{
  "_id": "69e79b9d56cd4d0b6aed1a8f",
  "game_id": 38,
  "game_date": "2026-01-09",
  "home_team": {
    "team_id": 8,
    "team_name": "Denver Nuggets",
    "team_score": 87
  },
  "away_team": {
    "team_id": 1,
    "team_name": "Atlanta Hawks",
    "team_score": 110
  },
  "players": [
    {
      "player_id": 107,
      "name": "Nikola Jokic",
      "team_id": 8,
      "stats": {
        "points": 34,
        "rebounds": 13,
        "assists": 9,
        "steals": 1,
        "blocks": 2,
        "minutes": 36
      }
    }
  ]
}
```

### In-Memory Fallback Mode
If `MONGODB_URI` is unconfigured, unreachable, or DNS cannot be resolved, the backend automatically runs in **demo fallback mode** using realistic NBA games data (`sampleData.js`), allowing the application to be tested without database setup.

---

## ✨ Features

- **Matchup Scoreboards**: Scoreboard cards showing Away vs Home teams, game IDs, dates, and actual final team scores from the database.
- **Per-Game Box Scores**: Detailed box score tables displaying player stats (`PTS`, `REB`, `AST`, `STL`, `BLK`, `MIN`).
- **All Players Leaderboard**: Comprehensive master table of all player performances across all games.
- **Isolated 3-State Column Sorting**:
  - **1st click**: Ascending (`▲`)
  - **2nd click**: Descending (`▼`)
  - **3rd click**: Reset (natural order, no arrow)
  - **Table Isolation**: Sorting one game's box score table operates independently and does not alter any other table on the page.
  - **Stable Layout**: Pre-allocated sort-arrow slots ensure columns never widen or shift when arrows toggle.
- **Game Filter**: Dropdown filter to view all matchups or isolate a specific game.

---

## 🛠 Available Scripts

In the project root, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs backend (port 5000) and frontend (port 3000) concurrently |
| `npm start` or `npm run server` | Starts the Express API server only |
| `npm run client` | Starts the React frontend development server only |
| `npm run seed` | Seeds MongoDB with sample NBA games data (`mongodbExample.js`) |
| `npm test` | Runs the automated Jest / React Testing Library test suite |
| `npm run build` | Builds the React frontend bundle for production |

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/status` | `GET` | Health check & MongoDB connection status (`database`, `collection`, `mode`) |
| `/api/games` | `GET` | Returns all games with home/away team details, actual team scores, and box scores |
| `/api/games/:id` | `GET` | Returns a single game by `game_id` or `_id` |
| `/api/players` | `GET` | Returns flattened player stats across all games (for leaderboards and sorting) |
| `/api/gamelogs` | `GET` | Backward-compatible alias for player box scores |

---

## 💡 Troubleshooting

### PowerShell Script Execution Policy (Windows)
If you see the error:
```
File ... npm.ps1 cannot be loaded because running scripts is disabled on this system
```
Use `npm.cmd` instead of `npm`:
```powershell
npm.cmd run dev
```
Or allow local script execution in your PowerShell session:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
