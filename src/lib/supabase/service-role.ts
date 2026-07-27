import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only, bypasses RLS entirely. Only for contexts with no user
// session to authenticate as — the Paystack webhook, and the donation
// callback page's fallback status check.
export function createServiceRoleClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
