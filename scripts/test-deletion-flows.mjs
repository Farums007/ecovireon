// Disposable end-to-end test of the approve-deletion-request flows.
// Creates throwaway auth users/org/data via the real Admin API + direct SQL
// (never touching the real seeded test accounts), exercises both RPCs plus
// the last-admin guard, verifies outcomes, then cleans everything up.
import { readFileSync as read } from "node:fs";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

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

const pg = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await pg.connect();

const PLATFORM_ADMIN_ID = "9ae9e64a-4a7e-4732-8d49-546509182995"; // real seeded platform admin

async function asPlatformAdmin(fn) {
  await pg.query("begin");
  try {
    await pg.query("set local role authenticated");
    await pg.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: PLATFORM_ADMIN_ID, role: "authenticated" }),
    ]);
    return await fn();
  } finally {
    await pg.query("commit");
  }
}

function tag(label) {
  return `qa-${label}-${randomUUID().slice(0, 8)}@ecovireon-qa.invalid`;
}

async function createUser(email, metadata) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: `Qa!${randomUUID()}`,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw new Error(`createUser(${email}) failed: ${error.message}`);
  return data.user.id;
}

const results = [];
function check(label, condition) {
  results.push({ label, pass: !!condition });
  console.log(`${condition ? "PASS" : "FAIL"}: ${label}`);
}

let userA, userB, userC, userD, orgA, orgD, projectA;

try {
  console.log("--- Setting up throwaway data ---");

  userA = await createUser(tag("org-admin-a"), {
    account_type: "organization",
    full_name: "QA Org Admin A",
    organization_name: "QA Deletion Test Org",
  });
  const { data: profA } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userA)
    .single();
  orgA = profA.organization_id;

  userB = await createUser(tag("org-member-b"), {
    account_type: "individual",
    full_name: "QA Org Member B",
  });
  // Simulate B being an active member of org A (bypassing the invite flow,
  // which was already verified separately — this is just test setup).
  await pg.query(
    "update profiles set organization_id=$1, role='field_staff', account_type='organization' where id=$2",
    [orgA, userB]
  );
  await pg.query(
    "insert into organization_members (user_id, organization_id, role) values ($1, $2, 'field_staff')",
    [userB, orgA]
  );

  userC = await createUser(tag("individual-c"), {
    account_type: "individual",
    full_name: "QA Individual C",
  });

  userD = await createUser(tag("sole-admin-d"), {
    account_type: "organization",
    full_name: "QA Sole Admin D",
    organization_name: "QA Sole Admin Org",
  });
  const { data: profD } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userD)
    .single();
  orgD = profD.organization_id;

  const projRes = await pg.query(
    `insert into projects (organization_id, name, description, project_type, status, goals, created_by)
     values ($1, 'QA Test Project', 'disposable', 'restoration', 'active', '[]'::jsonb, $2) returning id`,
    [orgA, userA]
  );
  projectA = projRes.rows[0].id;

  await pg.query(
    `insert into field_observations (project_id, submitted_by, observed_at, metrics, notes)
     values ($1, $2, now(), '{}'::jsonb, 'qa test observation')`,
    [projectA, userA]
  );
  await pg.query(
    `insert into reports (project_id, title, period_start, period_end, observation_count, csv_path, pdf_path, generated_by)
     values ($1, 'QA Report', now(), now(), 1, 'qa/test.csv', 'qa/test.pdf', $2)`,
    [projectA, userA]
  );
  const treeOrgRes = await pg.query(
    `insert into trees (planted_by, owner_id, organization_id, species, photo_path, location, observed_at, status, co2_estimate_kg)
     values ($1, $1, $2, 'QA Species', 'qa/tree.jpg', ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326), now(), 'approved', 21) returning id`,
    [userA, orgA]
  );
  const treeOrgId = treeOrgRes.rows[0].id;

  const donationOrgRes = await pg.query(
    `insert into donations (donor_id, donor_email, organization_id, project_id, tree_count, amount_kobo, payment_reference, status)
     values ($1, 'qa@ecovireon-qa.invalid', $2, $3, 1, 500000, $4, 'paid') returning id`,
    [userC, orgA, projectA, `qa-ref-${randomUUID()}`]
  );
  const donationOrgId = donationOrgRes.rows[0].id;

  const treeCRes = await pg.query(
    `insert into trees (planted_by, owner_id, species, photo_path, location, observed_at, status, co2_estimate_kg)
     values ($1, $1, 'QA Species C', 'qa/treec.jpg', ST_SetSRID(ST_MakePoint(3.3792, 6.5244), 4326), now(), 'approved', 21) returning id`,
    [userC]
  );
  const treeCId = treeCRes.rows[0].id;

  const donationCRes = await pg.query(
    `insert into donations (donor_id, donor_email, tree_count, amount_kobo, payment_reference, status)
     values ($1, 'qa@ecovireon-qa.invalid', 1, 250000, $2, 'paid') returning id`,
    [userC, `qa-ref-${randomUUID()}`]
  );
  const donationCId = donationCRes.rows[0].id;

  const reqOrgRes = await pg.query(
    `insert into deletion_requests (type, organization_id, requested_by, reason) values ('organization', $1, $2, 'qa test') returning id`,
    [orgA, userA]
  );
  const requestOrgId = reqOrgRes.rows[0].id;

  const reqCRes = await pg.query(
    `insert into deletion_requests (type, user_id, requested_by, reason) values ('individual', $1, $2, 'qa test') returning id`,
    [userC, userC]
  );
  const requestCId = reqCRes.rows[0].id;

  const reqDRes = await pg.query(
    `insert into deletion_requests (type, user_id, requested_by, reason) values ('individual', $1, $2, 'qa test') returning id`,
    [userD, userD]
  );
  const requestDId = reqDRes.rows[0].id;

  console.log("\n--- Test 1: approve_organization_deletion_request ---");
  await asPlatformAdmin(async () => {
    await pg.query("select approve_organization_deletion_request($1)", [requestOrgId]);
  });

  const orgGone = await pg.query("select id from organizations where id=$1", [orgA]);
  check("org row deleted", orgGone.rows.length === 0);

  const profAfter = await pg.query(
    "select organization_id, role, account_type from profiles where id in ($1,$2)",
    [userA, userB]
  );
  check(
    "members A and B converted to individual (not deleted)",
    profAfter.rows.length === 2 &&
      profAfter.rows.every((r) => r.organization_id === null && r.role === null && r.account_type === "individual")
  );

  const projectGone = await pg.query("select id from projects where id=$1", [projectA]);
  check("project cascaded away", projectGone.rows.length === 0);

  const treeOrgAfter = await pg.query(
    "select organization_id, owner_id from trees where id=$1",
    [treeOrgId]
  );
  check(
    "org tree preserved, org unlinked, owner untouched",
    treeOrgAfter.rows.length === 1 &&
      treeOrgAfter.rows[0].organization_id === null &&
      treeOrgAfter.rows[0].owner_id === userA
  );

  const donationOrgAfter = await pg.query(
    "select organization_id, project_id, donor_id from donations where id=$1",
    [donationOrgId]
  );
  check(
    "org donation preserved, org+project unlinked, donor untouched",
    donationOrgAfter.rows.length === 1 &&
      donationOrgAfter.rows[0].organization_id === null &&
      donationOrgAfter.rows[0].project_id === null &&
      donationOrgAfter.rows[0].donor_id === userC
  );

  const reqOrgAfter = await pg.query(
    "select status, organization_id, target_name from deletion_requests where id=$1",
    [requestOrgId]
  );
  check(
    "request marked completed with target_name snapshot, survives org gone",
    reqOrgAfter.rows.length === 1 &&
      reqOrgAfter.rows[0].status === "completed" &&
      reqOrgAfter.rows[0].organization_id === null &&
      reqOrgAfter.rows[0].target_name === "QA Deletion Test Org"
  );

  console.log("\n--- Test 2: prepare_individual_deletion (userC, plain individual) ---");
  let returnedUserId;
  await asPlatformAdmin(async () => {
    const r = await pg.query("select prepare_individual_deletion($1) as uid", [requestCId]);
    returnedUserId = r.rows[0].uid;
  });
  check("RPC returned correct user id", returnedUserId === userC);

  const { error: deleteCErr } = await admin.auth.admin.deleteUser(userC);
  check("auth.users deleted for C", !deleteCErr);

  const treeCAfter = await pg.query("select owner_id, planted_by from trees where id=$1", [treeCId]);
  check(
    "C's tree preserved, anonymized",
    treeCAfter.rows.length === 1 &&
      treeCAfter.rows[0].owner_id === null &&
      treeCAfter.rows[0].planted_by === null
  );
  const donationCAfter = await pg.query("select donor_id from donations where id=$1", [donationCId]);
  check(
    "C's donation preserved, anonymized",
    donationCAfter.rows.length === 1 && donationCAfter.rows[0].donor_id === null
  );
  const profCGone = await pg.query("select id from profiles where id=$1", [userC]);
  check("C's profile gone (cascaded from auth.users)", profCGone.rows.length === 0);

  await pg.query(
    "update deletion_requests set status='completed', resolved_by=$1, resolved_at=now(), target_name=$2 where id=$3",
    [PLATFORM_ADMIN_ID, "QA Individual C", requestCId]
  );
  const reqCAfter = await pg.query(
    "select status, user_id, target_name from deletion_requests where id=$1",
    [requestCId]
  );
  check(
    "C's request completed, survives account gone, target_name set",
    reqCAfter.rows.length === 1 &&
      reqCAfter.rows[0].status === "completed" &&
      reqCAfter.rows[0].user_id === null &&
      reqCAfter.rows[0].target_name === "QA Individual C"
  );

  console.log("\n--- Test 3: last-admin guard rejects deleting sole org admin (userD) ---");
  let guardError = null;
  try {
    await asPlatformAdmin(async () => {
      await pg.query("select prepare_individual_deletion($1)", [requestDId]);
    });
  } catch (err) {
    guardError = err;
  }
  check(
    "sole-admin deletion rejected with expected message",
    guardError && /only admin/i.test(guardError.message)
  );
  const profDStillAdmin = await pg.query(
    "select organization_id, role from profiles where id=$1",
    [userD]
  );
  check(
    "D untouched after rejected attempt",
    profDStillAdmin.rows[0]?.organization_id === orgD && profDStillAdmin.rows[0]?.role === "admin"
  );

  console.log("\n--- Cleaning up remaining throwaway accounts (A, B, D) ---");
  // A and B survived the org deletion as individuals — run them through the
  // same individual-deletion path for full, realistic cleanup and a bit of
  // extra coverage (deleting someone who was just converted from a member).
  for (const [label, userId] of [["A", userA], ["B", userB]]) {
    const reqRes = await pg.query(
      `insert into deletion_requests (type, user_id, requested_by, reason) values ('individual', $1, $1, 'qa cleanup') returning id`,
      [userId]
    );
    await asPlatformAdmin(async () => {
      await pg.query("select prepare_individual_deletion($1)", [reqRes.rows[0].id]);
    });
    const { error } = await admin.auth.admin.deleteUser(userId);
    console.log(`cleanup ${label}: ${error ? "FAILED - " + error.message : "ok"}`);
  }
  const { error: deleteDErr } = await admin.auth.admin.deleteUser(userD);
  console.log(`cleanup D: ${deleteDErr ? "FAILED - " + deleteDErr.message : "ok"}`);
  await pg.query("delete from organizations where id=$1", [orgD]);
  await pg.query("delete from trees where id in ($1,$2)", [treeOrgId, treeCId]);
  await pg.query("delete from donations where id in ($1,$2)", [donationOrgId, donationCId]);
  await pg.query("delete from deletion_requests where id in ($1,$2)", [requestOrgId, requestCId]);
} finally {
  await pg.end();
}

console.log("\n--- Summary ---");
const failed = results.filter((r) => !r.pass);
console.log(`${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log("FAILURES:", failed.map((f) => f.label));
  process.exit(1);
}
