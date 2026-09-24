require("dotenv").config();
const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const {
  getSampleGames,
  enrichGameWithScores,
  flattenGamePlayers,
  getSampleGameLogs,
} = require("./sampleData");

const app = express();
app.use(cors()); // allows React on port 3000 to call this server
app.use(express.json()); // parses JSON request bodies

const PORT = process.env.PORT || 5000;

// Resolve MongoDB connection string (from process.env or fallback scan of .env)
let uri = process.env.MONGODB_URI;
if (!uri) {
  try {
    const envFile = path.join(__dirname, ".env");
    if (fs.existsSync(envFile)) {
      const content = fs.readFileSync(envFile, "utf8");
      const match = content.match(/mongodb(?:\+srv)?:\/\/[^\s"']+/);
      if (match) {
        uri = match[0];
      }
    }
  } catch (e) {
    // Ignore fallback scan error
  }
}

const DB_NAME = process.env.DB_NAME || "stats";
const COLLECTION = process.env.COLLECTION || "games";

let db = null;
let dbMode = "disconnected"; // "mongodb" or "fallback"
let inMemoryGames = [];

// Connect to MongoDB Atlas or local MongoDB; fall back to in-memory demo data if unreachable
async function connectDB() {
  if (!uri) {
    console.warn("⚠️  MONGODB_URI not found in .env.");
    enableFallback("No MONGODB_URI configured");
    return;
  }

  try {
    console.log("🔌 Attempting to connect to MongoDB...");
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    db = client.db(DB_NAME);
    dbMode = "mongodb";
    console.log(`✅ Connected to MongoDB (${DB_NAME}.${COLLECTION})`);
  } catch (err) {
    console.warn(`⚠️  MongoDB connection failed: ${err.message}`);
    enableFallback(err.message);
  }
}

function enableFallback(reason) {
  dbMode = "fallback";
  inMemoryGames = getSampleGames();
  console.log("📦 Running in in-memory fallback demo mode with sample NBA games.");
  console.log("💡 To connect to a live MongoDB instance, update MONGODB_URI in your .env file.\n");
}

// GET /api/status — health & connection information
app.get("/api/status", async (req, res) => {
  res.json({
    status: "ok",
    mode: dbMode,
    database: DB_NAME,
    collection: COLLECTION,
    message:
      dbMode === "mongodb"
        ? `Connected to live MongoDB (${DB_NAME}.${COLLECTION})`
        : "Running with in-memory sample NBA data",
  });
});

// GET /api/games — returns full game matchups with calculated scores and player rosters
app.get("/api/games", async (req, res) => {
  try {
    if (dbMode === "mongodb" && db) {
      const docs = await db
        .collection(COLLECTION)
        .find({})
        .sort({ game_date: -1 })
        .toArray();
      const enriched = docs.map(enrichGameWithScores);
      return res.json(enriched);
    }

    const enriched = inMemoryGames.map(enrichGameWithScores);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/games/:id — returns one game by game_id or _id
app.get("/api/games/:id", async (req, res) => {
  const { id } = req.params;

  try {
    if (dbMode === "mongodb" && db) {
      const queries = [{ game_id: Number(id) || -1 }, { _id: id }];
      if (ObjectId.isValid(id)) {
        queries.push({ _id: new ObjectId(id) });
      }
      const doc = await db.collection(COLLECTION).findOne({ $or: queries });
      if (!doc) return res.status(404).json({ error: "Game not found" });
      return res.json(enrichGameWithScores(doc));
    }

    const doc = inMemoryGames.find(
      (g) => String(g.game_id) === String(id) || String(g._id) === String(id)
    );
    if (!doc) return res.status(404).json({ error: "Game not found" });
    res.json(enrichGameWithScores(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players — returns flattened player box scores across all games
app.get("/api/players", async (req, res) => {
  try {
    if (dbMode === "mongodb" && db) {
      const docs = await db
        .collection(COLLECTION)
        .find({})
        .sort({ game_date: -1 })
        .toArray();
      return res.json(flattenGamePlayers(docs));
    }

    res.json(flattenGamePlayers(inMemoryGames));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/gamelogs — backward compatibility alias for /api/players
app.get("/api/gamelogs", async (req, res) => {
  try {
    if (dbMode === "mongodb" && db) {
      const docs = await db
        .collection(COLLECTION)
        .find({})
        .sort({ game_date: -1 })
        .toArray();
      return res.json(flattenGamePlayers(docs));
    }

    res.json(flattenGamePlayers(inMemoryGames));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API running at http://localhost:${PORT}`);
  });
});