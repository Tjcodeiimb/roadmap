import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for the admin route segment.
 *
 * Hiding the sidebar link is not access control — the pages were reachable by
 * typing the URL, which exposed the invite form, the roster (every employee's
 * email) and the content editor to any signed-in employee. Writes were already
 * blocked by requireAdmin() in the server actions, so this closes the read and
 * fake-authority surface.
 *
 * Answers 404 rather than 403 so the admin area isn't advertised to people who
 * have no business knowing it exists.
 */
export async function requireAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") notFound();

  return supabase;
}
