"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }
  redirect("/dashboard");
}

export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");

  if (password !== confirm) return { error: "Passwords do not match." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled in Supabase settings, the session is
  // returned immediately and we can redirect the user straight to onboarding.
  // Otherwise (confirmation required) we fall through and the form shows a
  // "check your email" message.
  if (data.session) redirect("/onboarding");
  return { sent: true };
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/onboarding`,
    },
  });
  if (error) return { error: error.message };
  return { sent: true };
}

export async function setPassword(formData: FormData) {
  const password = String(formData.get("password") || "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateUsername(formData: FormData) {
  const username = String(formData.get("username") || "").trim().toLowerCase();
  if (!/^[a-z][a-z0-9_]{2,29}$/.test(username)) {
    return { error: "Username must be 3–30 characters, start with a letter, and contain only letters, numbers, and underscores." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_username", { p_username: username });
  if (error) {
    if (error.message.includes("unique")) return { error: "That username is already taken." };
    return { error: error.message };
  }
  return { success: true };
}
