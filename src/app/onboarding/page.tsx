import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (profile?.onboarded) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <OnboardingWizard />
    </div>
  );
}
