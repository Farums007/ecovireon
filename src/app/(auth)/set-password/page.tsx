import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/queries/profile";
import { SetPasswordForm } from "@/app/(auth)/set-password/set-password-form";

export default async function SetPasswordPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return <SetPasswordForm initialFullName={profile.fullName} />;
}
