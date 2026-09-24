require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId, ServerApiVersion } = require("mongodb");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.API_PORT || 5050;
const uri = process.env.MONGODB_URI || "mongodb+srv://cwinfield1_db_user:Jh4bhfrf53Ljdn9c@nbastats.geq20qg.mongodb.net/?appName=nbaStats";
const DB_NAME = "nba_stats";
const COLLECTION = "game_logs";

let db = null;
let dbMode = "disconnected";

// Sample game logs used if MongoDB is offline or unreachable
const fallbackGameLogs = [
  {
    _id: "69d509cb9876b7d9d7e1fef9",
    player: "Jayson Tatum",
    team: "BOS",
    opponent: "MIA",
    points: 35,
    rebounds: 9,
    assists: 4,
    steals: 0,
    blocks: 1,
    minutesPlayed: 37,
    gameDate: "2026-04-04T13:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fefb",
    player: "Austin Reaves",
    team: "LAL",
    opponent: "WSH",
    points: 19,
    rebounds: 3,
    assists: 9,
    steals: 1,
    blocks: 0,
    minutesPlayed: 27,
    gameDate: "2026-03-30T22:12:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fefd",
    player: "Joel Embiid",
    team: "PHI",
    opponent: "NYK",
    points: 33,
    rebounds: 10,
    assists: 3,
    steals: 1,
    blocks: 4,
    minutesPlayed: 33,
    gameDate: "2026-03-29T13:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fefa",
    player: "Giannis Antetokounmpo",
    team: "MIL",
    opponent: "CHI",
    points: 44,
    rebounds: 12,
    assists: 6,
    steals: 1,
    blocks: 3,
    minutesPlayed: 35,
    gameDate: "2026-04-03T13:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fef6",
    player: "Victor Wembanyama",
    team: "SAS",
    opponent: "GSW",
    points: 41,
    rebounds: 18,
    assists: 3,
    steals: 0,
    blocks: 3,
    minutesPlayed: 29,
    gameDate: "2026-04-01T22:12:35.132Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fef8",
    player: "Nikola Jokic",
    team: "DEN",
    opponent: "PHX",
    points: 27,
    rebounds: 14,
    assists: 9,
    steals: 1,
    blocks: 2,
    minutesPlayed: 34,
    gameDate: "2026-04-05T13:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1feff",
    player: "Devin Booker",
    team: "PHX",
    opponent: "UTA",
    points: 37,
    rebounds: 4,
    assists: 7,
    steals: 1,
    blocks: 0,
    minutesPlayed: 38,
    gameDate: "2026-03-25T13:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fefc",
    player: "Luka Doncic",
    team: "DAL",
    opponent: "SAS",
    points: 49,
    rebounds: 11,
    assists: 8,
    steals: 2,
    blocks: 0,
    minutesPlayed: 39,
    gameDate: "2026-03-31T13:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fef7",
    player: "CJ McCollum",
    team: "ATL",
    opponent: "BKN",
    points: 25,
    rebounds: 2,
    assists: 7,
    steals: 1,
    blocks: 0,
    minutesPlayed: 25,
    gameDate: "2026-04-03T19:42:35.133Z"
  },
  {
    _id: "69d509cb9876b7d9d7e1fefe",
    player: "Bam Adebayo",
    team: "MIA",
    opponent: "WSH",
    points: 83,
    rebounds: 9,
    assists: 3,
    steals: 2,
    blocks: 2,
    minutesPlayed: 42,
    gameDate: "2026-03-10T19:41:35.133Z"
  }
];

async function connectDB() {
  if (!uri) {
    console.warn("⚠️  MONGODB_URI not found in .env; running in fallback mode.");
    dbMode = "fallback";
    return;
  }

  try {
    console.log("🔌 Connecting to MongoDB Atlas...");
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    db = client.db(DB_NAME);
    dbMode = "mongodb";
    console.log(`✅ Connected to database: "${DB_NAME}", collection: "${COLLECTION}"`);
  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed: ${err.message}. Using fallback data.`);
    dbMode = "fallback";
  }
}

// GET /api/status - health and database status
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    mode: dbMode,
    database: DB_NAME,
    collection: COLLECTION,
    port: PORT,
    message: dbMode === "mongodb"
      ? "Connected to live MongoDB Atlas"
      : "Running with in-memory sample NBA data"
  });
});

// GET /api/gamelogs - get all game logs
app.get("/api/gamelogs", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

  try {
    if (dbMode === "mongodb" && db) {
      const logs = await db
        .collection(COLLECTION)
        .find({})
        .sort({ gameDate: -1 })
        .limit(limit)
        .toArray();
      return res.json(logs);
    }

    const sorted = [...fallbackGameLogs].sort(
      (a, b) => new Date(b.gameDate) - new Date(a.gameDate)
    );
    res.json(sorted.slice(0, limit));
  } catch (err) {
    console.error("Error fetching game logs:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gamelogs/:id - get single game log
app.get("/api/gamelogs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (dbMode === "mongodb" && db) {
      let query = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }
      const log = await db.collection(COLLECTION).findOne(query);
      if (!log) return res.status(404).json({ error: "Game log not found" });
      return res.json(log);
    }

    const log = fallbackGameLogs.find((item) => String(item._id) === String(id));
    if (!log) return res.status(404).json({ error: "Game log not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 NBA Stats API server listening on http://localhost:${PORT}`);
  });
});
