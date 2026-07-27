// Usage: node scripts/db-query.mjs "select * from public.profiles"
// Requires SUPABASE_DB_URL in .env.local (direct Postgres connection string).
import { readFileSync as read } from "node:fs";
import { Client } from "pg";

const sql = process.argv[2];
if (!sql) {
  console.error('Usage: node scripts/db-query.mjs "<sql>"');
  process.exit(1);
}

const envLocal = read(new URL("../.env.local", import.meta.url), "utf-8");
for (const line of envLocal.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(sql);
  console.table(result.rows);
} catch (err) {
  console.error("Query failed:", err.message);
  process.exit(1);
} finally {
  await client.end();
}
