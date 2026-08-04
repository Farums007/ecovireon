"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = { error: string } | null;

// Only ever redirect to a same-site relative path after login — a raw
// query param here would otherwise be an open-redirect vector.
function safeRedirectTarget(raw: FormDataEntryValue | null): string {
  const value = String(raw ?? "");
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  return "/";
}

export async function login(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirectTarget(formData.get("redirectTo"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signup(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const accountType = formData.get("accountType") === "individual" ? "individual" : "organization";

  const data: Record<string, string> = {
    account_type: accountType,
    full_name: fullName,
  };

  if (accountType === "organization") {
    data.organization_name = String(formData.get("organizationName") ?? "");
  } else {
    data.country = String(formData.get("country") ?? "");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?confirmEmail=1");
}

// Always redirects the same way whether or not the email has an account —
// disclosing that would let someone enumerate registered addresses.
export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/reset-password`,
  });

  redirect("/forgot-password?sent=1");
}

// Lands here after /auth/callback verifies the recovery link's token_hash,
// which already establishes a session — same mechanism as the email-change
// confirmation flow.
export async function completePasswordReset(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Steps out of org context into a personal view without leaving the org —
// organization_members keeps the membership, so switching back later still
// works. Used by the "Switch to personal dashboard" option in the org
// dashboard's profile menu.
export async function switchToIndividualAction() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("switch_to_individual");
  if (error) throw new Error(error.message);

  redirect("/account");
}

// Lands here after an invited user (no password yet) clicks their invite
// email and /auth/callback exchanges the code for a session.
export async function setPassword(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) return { error: passwordError.message };

  if (fullName) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    if (profileError) return { error: profileError.message };
  }

  redirect("/account");
}
