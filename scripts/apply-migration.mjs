// Usage: node scripts/apply-migration.mjs supabase/migrations/0001_orgs_and_profiles.sql
// Requires SUPABASE_DB_URL in .env.local (direct Postgres connection string).
import { readFileSync as read } from "node:fs";
import { Client } from "pg";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node scripts/apply-migration.mjs <path-to-sql-file>");
  process.exit(1);
}

const envLocal = read(new URL("../.env.local", import.meta.url), "utf-8");
for (const line of envLocal.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error("SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

const sql = read(path, "utf-8");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied ${path}`);
} catch (err) {
  console.error(`Failed to apply ${path}:`, err.message);
  process.exit(1);
} finally {
  await client.end();
}
