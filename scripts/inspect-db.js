require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function inspect() {
  const members = await sql`SELECT email, role FROM members`;
  const clients = await sql`SELECT count(*)::int as count FROM clients`;
  const complaints = await sql`SELECT count(*)::int as count FROM complaints`;
  const accessRequests = await sql`SELECT count(*)::int as count FROM access_requests`;
  const citizens = await sql`SELECT count(*)::int as count FROM citizens`;

  console.log('--- CURRENT DATABASE STATS ---');
  console.log('Members:', members);
  console.log('Total Clients registered:', clients[0].count);
  console.log('Total Complaints filed:', complaints[0].count);
  console.log('Total Access requests:', accessRequests[0].count);
  console.log('Total Citizens:', citizens[0].count);
}
inspect().catch(console.error);
