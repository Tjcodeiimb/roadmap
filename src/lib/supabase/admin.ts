import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Service-role client. NEVER import this from a Client Component or expose
// SUPABASE_SERVICE_ROLE_KEY to the browser — it bypasses Row Level Security.
// Only used server-side, and only for the one thing regular RLS-scoped
// clients cannot do: inviting new employees via the Auth Admin API.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
