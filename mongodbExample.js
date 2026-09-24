/**
 * mongodbExample.js — MongoDB Atlas quickstart for an NBA stats web app
 *
 * Install: npm install mongodb dotenv
 * Run:     node mongodbExample.js
 *
 * Before running, create a .env file in the same folder with:
 *   MONGODB_URI=your_atlas_connection_string_here
 */

require("dotenv").config(); // Loads .env into process.env before anything else runs
const { MongoClient, ObjectId } = require("mongodb");
const { getSampleGameLogs } = require("./sampleData");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Pull the URI from the environment so the real connection string never
// appears in source code or version control.
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error(
    "❌  MONGODB_URI is not set. Add it to a .env file or your system environment."
  );
  process.exit(1);
}

const DB_NAME = process.env.DB_NAME || "stats";
const COLLECTION = process.env.COLLECTION || "games";
const { getSampleGames, getSampleGameLogs } = require("./sampleData");

// Prepare sample data
const sampleDocs =
  COLLECTION === "games"
    ? getSampleGames().map((doc) => {
        const { _id, ...rest } = doc;
        return {
          _id: new ObjectId(_id),
          ...rest,
        };
      })
    : getSampleGameLogs().map((doc) => {
        const { _id, ...rest } = doc;
        return {
          _id: new ObjectId(_id),
          ...rest,
        };
      });

// ---------------------------------------------------------------------------
// Main — all Atlas operations happen here
// ---------------------------------------------------------------------------

async function main() {
  // MongoClient is the single entry point for every operation against Atlas.
  // It manages the connection pool internally, so one client per app is ideal.
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

  try {
    // ── Connect ─────────────────────────────────────────────────────────────
    console.log("🔌  Connecting to MongoDB Atlas...");
    await client.connect();
    // .ping confirms the server actually responded — good sanity check on startup
    await client.db("admin").command({ ping: 1 });
    console.log("✅  Connected successfully!\n");

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION);

    // ── Optional: clear existing collection so re-running seed doesn't duplicate
    await collection.deleteMany({});

    // ── Insert ──────────────────────────────────────────────────────────────
    console.log(`📥  Inserting ${sampleDocs.length} documents into ${DB_NAME}.${COLLECTION}...`);
    const insertResult = await collection.insertMany(sampleDocs);
    console.log(`✅  Inserted ${insertResult.insertedCount} documents.\n`);

    // Save one _id now so we can do a single-document lookup by it later.
    const sampleId = Object.values(insertResult.insertedIds)[0];

    // ── Read: 5 most recent ─────────────────────────────────────────────────
    console.log("📋  5 most recent game logs (sorted by gameDate descending):");
    const recentDocs = await collection
      .find({})
      .sort({ gameDate: -1 })
      .limit(5)
      .toArray();

    recentDocs.forEach((doc, i) => {
      console.log(
        `  ${i + 1}. ${doc.player.padEnd(25)} ${doc.points} pts  ` +
          `${doc.gameDate.toISOString().slice(0, 10)}`
      );
    });
    console.log();

    // ── Read: single document by _id ────────────────────────────────────────
    console.log(`🔍  Fetching single document by _id: ${sampleId}`);
    const singleDoc = await collection.findOne({ _id: new ObjectId(sampleId) });

    if (singleDoc) {
      console.log("✅  Found document:");
      console.log(JSON.stringify(singleDoc, null, 2));
    } else {
      console.log("⚠️   No document found for that _id.");
    }
  } catch (err) {
    // Catch covers both connection failures and query errors
    console.error("❌  An error occurred:", err.message);

    if (err.message.includes("ENOTFOUND") || err.message.includes("querySrv")) {
      console.error(
        "\n💡  Troubleshooting hint: The cluster hostname in MONGODB_URI could not be found via DNS."
      );
      console.error(
        "    If your Atlas cluster was paused or deleted due to inactivity, log in to https://cloud.mongodb.com"
      );
      console.error(
        "    and update MONGODB_URI in your .env file with your current active cluster connection string."
      );
    }
    process.exitCode = 1;
  } finally {
    // finally always runs — guarantees the connection is released even on error
    await client.close();
    console.log("\n🔒  Connection closed. Done!");
  }
}

main();
