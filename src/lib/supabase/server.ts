import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// TODO: once the schema is live, run
//   npx supabase gen types typescript --project-id <ref> > src/lib/supabase/types.ts
// and parameterize this client with the generated `Database` type.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without a mutable cookie jar
            // (e.g. during static rendering). Session refresh happens in
            // proxy.ts instead, so this is safe to ignore here.
          }
        },
      },
    }
  );
}
