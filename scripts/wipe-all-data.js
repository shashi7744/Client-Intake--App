require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);

  console.log("Wiping all application data from Neon database...");

  // 1. Delete access requests
  const dRequests = await sql`DELETE FROM access_requests RETURNING id`;
  console.log(`- Deleted ${dRequests.length} access requests.`);

  // 2. Delete clients
  const dClients = await sql`DELETE FROM clients RETURNING id`;
  console.log(`- Deleted ${dClients.length} clients.`);

  // 3. Delete complaints
  const dComplaints = await sql`DELETE FROM complaints RETURNING id`;
  console.log(`- Deleted ${dComplaints.length} complaints.`);

  // 4. Delete citizens
  const dCitizens = await sql`DELETE FROM citizens RETURNING email`;
  console.log(`- Deleted ${dCitizens.length} citizens.`);

  // 5. Delete email OTPs
  const dOtps = await sql`DELETE FROM email_otps RETURNING email`;
  console.log(`- Deleted ${dOtps.length} email OTP records.`);

  // 6. Delete members
  const dMembers = await sql`DELETE FROM members RETURNING email`;
  console.log(`- Deleted ${dMembers.length} members.`);

  console.log("\nALL DATABASE TABLES HAVE BEEN FULLY CLEARED!");
}

main().catch((err) => {
  console.error("Wipe failed:", err);
  process.exit(1);
});
