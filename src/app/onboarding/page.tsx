import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTracks, getSelectedTracks } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [tracks, selected] = await Promise.all([getAllTracks(supabase), getSelectedTracks(supabase)]);
  if (selected.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <OnboardingWizard tracks={tracks} />
    </div>
  );
}
