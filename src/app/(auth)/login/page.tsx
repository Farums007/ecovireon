import type { Metadata } from "next";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmEmail?: string; redirectTo?: string }>;
}) {
  const { confirmEmail, redirectTo } = await searchParams;
  return (
    <LoginForm justSignedUp={confirmEmail === "1"} redirectTo={redirectTo} />
  );
}
