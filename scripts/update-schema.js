require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  console.log("Updating members: setting is_paid = true for all members...");
  await sql`UPDATE members SET is_paid = TRUE`;
  await sql`ALTER TABLE members ALTER COLUMN is_paid SET DEFAULT TRUE`;

  console.log("Updating complaints: making category optional with default 'General'...");
  await sql`ALTER TABLE complaints ALTER COLUMN category DROP NOT NULL`;
  await sql`ALTER TABLE complaints ALTER COLUMN category SET DEFAULT 'General'`;

  console.log("Database schema updated successfully!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
