import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: selections } = await supabase
    .from("user_track_selection")
    .select("track_id")
    .limit(1);

  redirect(selections && selections.length > 0 ? "/dashboard" : "/onboarding");
}
