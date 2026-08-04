import { readFileSync as read } from "node:fs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const envLocal = read(new URL("../.env.local", import.meta.url), "utf-8");
for (const line of envLocal.split("\n")) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const admin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
const qaUsers = data.users.filter((u) => u.email?.endsWith("@ecovireon-qa.invalid"));

for (const u of qaUsers) {
  const { error } = await admin.auth.admin.deleteUser(u.id);
  console.log(u.email, error ? `FAILED: ${error.message}` : "deleted");
}
if (qaUsers.length === 0) console.log("no qa users found");
