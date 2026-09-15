import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(supabase, user.id);
  if (profile?.onboarded) redirect("/dashboard");

  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get("theme")?.value;
  const theme = cookieTheme === "dark" ? "dark" : "light";

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-paper px-4 py-12">
      <div className="fixed right-4 z-20" style={{ top: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}>
        <ThemeToggle initialTheme={theme} />
      </div>
      <OnboardingWizard />
    </div>
  );
}
