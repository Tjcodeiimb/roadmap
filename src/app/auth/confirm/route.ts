import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Handles the ?token_hash=&type= links Supabase sends for magic links,
// invites, and password recovery.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/onboarding";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const redirectNext = type === "recovery" ? "/profile?set-password=1" : next;
      return NextResponse.redirect(`${origin}${redirectNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
