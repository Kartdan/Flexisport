/**
 * Seeds the sports collection for Romania.
 * Run with: node scripts/seedSports.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Sport = require("../models/Sport");

const romanianSports = [
  { name: "Football", slug: "football", emoji: "⚽", countryCodes: ["RO"] },
  { name: "Tennis", slug: "tennis", emoji: "🎾", countryCodes: ["RO"] },
  { name: "Basketball", slug: "basketball", emoji: "🏀", countryCodes: ["RO"] },
  { name: "Volleyball", slug: "volleyball", emoji: "🏐", countryCodes: ["RO"] },
  { name: "Handball", slug: "handball", emoji: "🤾", countryCodes: ["RO"] },
  { name: "Padel", slug: "padel", emoji: "🏓", countryCodes: ["RO"] },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  for (const sport of romanianSports) {
    await Sport.updateOne({ slug: sport.slug }, sport, { upsert: true });
    console.log(`🏅 Upserted: ${sport.name} (${sport.slug})`);
  }

  console.log("\n✅ Sports seeded successfully.");
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
