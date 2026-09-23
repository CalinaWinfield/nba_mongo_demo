require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const { getSampleGameLogs } = require("./sampleData");

const app = express();
app.use(cors());           // allows React on port 3000 to call this server
app.use(express.json());   // parses JSON request bodies

const PORT = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;
const DB_NAME = "nba_stats";
const COLLECTION = "game_logs";

let db = null;
let dbMode = "disconnected"; // "mongodb" or "fallback"
let inMemoryLogs = [];

// Connect to MongoDB Atlas or local MongoDB; fall back to in-memory demo data if unreachable
async function connectDB() {
  if (!uri) {
    console.warn("⚠️  MONGODB_URI not found in .env.");
    enableFallback("No MONGODB_URI configured");
    return;
  }

  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    // serverSelectionTimeoutMS prevents server from hanging for 30s when DNS or network fails
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 4000 });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    db = client.db(DB_NAME);
    dbMode = "mongodb";
    console.log(`✅ Connected to MongoDB (${DB_NAME})`);
  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed: ${err.message}`);
    enableFallback(err.message);
  }
}

function enableFallback(reason) {
  dbMode = "fallback";
  inMemoryLogs = getSampleGameLogs();
  console.log("📦 Running in in-memory fallback demo mode with sample NBA game logs.");
  console.log("💡 To connect to a live MongoDB instance, update MONGODB_URI in your .env file.\n");
}

// GET /api/status — health & connection information
app.get("/api/status", async (req, res) => {
  res.json({
    status: "ok",
    mode: dbMode,
    database: DB_NAME,
    collection: COLLECTION,
    message: dbMode === "mongodb"
      ? "Connected to live MongoDB"
      : "Running with in-memory sample NBA data"
  });
});

// GET /api/gamelogs — returns most recent logs (default 10)
app.get("/api/gamelogs", async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

  try {
    if (dbMode === "mongodb" && db) {
      const docs = await db
        .collection(COLLECTION)
        .find({})
        .sort({ gameDate: -1 })
        .limit(limit)
        .toArray();
      return res.json(docs);
    }

    // Fallback in-memory sorting and limiting
    const sorted = [...inMemoryLogs].sort(
      (a, b) => new Date(b.gameDate) - new Date(a.gameDate)
    );
    res.json(sorted.slice(0, limit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gamelogs/:id — returns one log by _id
app.get("/api/gamelogs/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (dbMode === "mongodb" && db) {
      let query = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { _id: new ObjectId(id) };
      }
      const doc = await db.collection(COLLECTION).findOne(query);
      if (!doc) return res.status(404).json({ error: "Not found" });
      return res.json(doc);
    }

    // Fallback in-memory lookup
    const doc = inMemoryLogs.find((item) => String(item._id) === String(id));
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
});