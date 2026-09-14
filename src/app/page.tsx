"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ClockMark } from "@/components/icons";

// Supabase's default (no-custom-SMTP-required) invite/magic-link emails
// deliver the session as a URL hash fragment on the Site URL
// (`#access_token=...&refresh_token=...&type=invite`, or `#error=...` if the
// link expired) — a hash fragment never reaches the server, so this has to
// be parsed and exchanged for a session here, client-side, before we know
// where to send the visitor next.
export default function RootPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const hash = window.location.hash;

    async function run() {
      if (hash.length > 1) {
        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const errorDescription = params.get("error_description");
        const type = params.get("type");

        window.history.replaceState(null, "", window.location.pathname);

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            setError(sessionError.message);
            return;
          }
          router.replace(type === "recovery" ? "/profile?set-password=1" : "/onboarding");
          return;
        }

        if (errorDescription) {
          setError(errorDescription.replace(/\+/g, " "));
          return;
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      router.replace(user ? "/dashboard" : "/login");
    }

    run();
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-paper px-4 text-center">
        <ClockMark size={40} className="text-ink-3" />
        <h1 className="font-display text-xl font-bold text-ink">That link expired</h1>
        <p className="max-w-sm text-sm text-ink-2">{error}</p>
        <a href="/login" className="text-sm font-medium text-accent underline underline-offset-4">
          Back to sign in
        </a>
      </div>
    );
  }

  return <div className="flex min-h-screen items-center justify-center bg-paper" />;
}
