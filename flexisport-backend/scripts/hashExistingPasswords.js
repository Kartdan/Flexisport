/**
 * One-time script to hash plain-text passwords for existing users.
 * Run with: node scripts/hashExistingPasswords.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const users = await User.find({});
  let updated = 0;

  for (const user of users) {
    if (user.password.startsWith("$2b$") || user.password.startsWith("$2a$")) {
      console.log(`⏭️  Skipping ${user.email} (already hashed)`);
      continue;
    }

    const hashed = await bcrypt.hash(user.password, 10);
    await User.updateOne({ _id: user._id }, { password: hashed });
    console.log(`🔐 Hashed password for ${user.email}`);
    updated++;
  }

  console.log(`\n✅ Done. ${updated} user(s) updated.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
