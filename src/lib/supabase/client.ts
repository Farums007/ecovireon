import { createBrowserClient } from "@supabase/ssr";

// TODO: once the schema is live, run
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
// and parameterize this client with the generated `Database` type.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
