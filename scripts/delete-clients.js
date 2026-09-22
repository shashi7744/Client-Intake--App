require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  console.log("Deleting all client entries from database...");
  const deletedRequests = await sql`DELETE FROM access_requests RETURNING id`;
  const deletedClients = await sql`DELETE FROM clients RETURNING id, name`;

  console.log(`Deleted ${deletedClients.length} client entries.`);
  console.log(`Deleted ${deletedRequests.length} access requests.`);
  console.log("Client entries cleared successfully!");
}

main().catch((err) => {
  console.error("Deletion failed:", err);
  process.exit(1);
});
