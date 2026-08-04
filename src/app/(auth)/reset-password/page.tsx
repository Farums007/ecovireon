import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { ResetPasswordForm } from "@/app/(auth)/reset-password/reset-password-form";

export default async function ResetPasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <ResetPasswordForm />;
}
