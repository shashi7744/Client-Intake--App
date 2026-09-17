#!/usr/bin/env node
// Promotes an existing member to admin, or demotes them back to a regular
// member. This is the ONLY way to create an admin account in this app -
// there is no sign-up flow or in-app button for it, on purpose.
//
// Usage:
//   node scripts/make-admin.js you@example.com
//   node scripts/make-admin.js you@example.com --remove
//
// The member must already have registered an account (via /register)
// before running this. Requires DATABASE_URL to be set in .env.local.

require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

const email = process.argv[2];
const remove = process.argv.includes("--remove");

if (!email) {
  console.error("Usage: node scripts/make-admin.js <email> [--remove]");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set.");
  console.error("Add it to .env.local - see .env.local.example for where to get it from Neon.");
  process.exit(1);
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const role = remove ? "member" : "admin";

  const rows = await sql`
    UPDATE members SET role = ${role}
    WHERE lower(email) = lower(${email})
    RETURNING email
  `;

  if (rows.length === 0) {
    console.error(`No member found with email "${email}".`);
    console.error("Register that account first at /register, then run this again.");
    process.exit(1);
  }

  console.log(
    remove
      ? `"${email}" is now a regular member (admin access removed).`
      : `"${email}" is now an admin. They'll see extra "Members" and "All Complaints" sections after logging in at /login.`
  );
}

main().catch((err) => {
  console.error("Failed:", err.message || err);
  process.exit(1);
});
