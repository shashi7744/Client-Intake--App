#!/usr/bin/env node
// Creates (or updates) all tables in your Neon/Postgres database.
// Safe to re-run any time - every statement is idempotent.
//
// Usage:
//   node scripts/migrate.js
//
// Requires DATABASE_URL to be set (in .env.local or the environment).

require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  console.error("Add it to .env.local - see .env.local.example for where to get it from Neon.");
  process.exit(1);
}

async function main() {
  const sql = neon(DATABASE_URL);
  const schemaPath = path.join(__dirname, "..", "lib", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  // Remove SQL comments before splitting to avoid semicolons inside comments
  // breaking the migration statements.
  const cleanSchema = schema
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/--.*$/gm, "");

  const statements = cleanSchema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Running ${statements.length} statements against your database...`);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log("Done. Tables are ready: members, citizens, clients, complaints, access_requests.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
