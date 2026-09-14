"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { ThemeName } from "@/lib/database.types";

export async function setTheme(theme: ThemeName) {
  const cookieStore = await cookies();
  cookieStore.set("theme", theme, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await supabase.from("profiles").update({ theme }).eq("id", user.id);
  }
}
