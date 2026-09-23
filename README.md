# 🏀 NBA Stats MongoDB Demo

A full-stack demonstration application showing how to store, query, and visualize NBA player game logs using **Express**, **MongoDB** (with automatic in-memory fallback), and **React**.

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

The application supports both **live MongoDB** (Atlas or local) and an **automatic in-memory fallback mode**.

### Option A: Out-of-the-Box Demo Mode (Zero Setup Required)
If `MONGODB_URI` in `.env` is unconfigured, unreachable, or DNS cannot be resolved, the backend automatically runs in **demo fallback mode** with 10 realistic NBA player game logs. No database installation is required to test the application!

### Option B: MongoDB Atlas (Cloud)
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow your IP address in **Network Access**.
3. In your `.env` file, set:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?appName=nbaStats
   ```
4. Seed the database with sample data:
   ```bash
   npm run seed
   ```

### Option C: Local MongoDB
If you have MongoDB installed locally:
```env
MONGODB_URI=mongodb://127.0.0.1:27017/nba_stats
```

---

## 🛠 Available Scripts

In the project root, you can run:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs backend (port 5000) and frontend (port 3000) concurrently |
| `npm start` or `npm run server` | Starts the Express API server only |
| `npm run client` | Starts the React frontend development server |
| `npm run seed` | Seeds MongoDB with 10 realistic NBA game logs (`mongodbExample.js`) |
| `npm test` | Runs the test suite |
| `npm run build` | Builds the React frontend for production |

---

## 🔌 API Endpoints

- `GET /api/status` — Returns database connection mode (`mongodb` or `fallback`)
- `GET /api/gamelogs` — Returns the most recent game logs (supports `?limit=N`)
- `GET /api/gamelogs/:id` — Returns a single game log by `_id`

---

## 💡 Troubleshooting

### PowerShell Script Execution Policy (Windows)
If you see the error:
```
File ... npm.ps1 cannot be loaded because running scripts is disabled on this system
```
You can use `npm.cmd` instead of `npm`, for example:
```powershell
npm.cmd run dev
```
Or allow script execution for your user session:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
