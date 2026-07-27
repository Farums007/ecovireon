import type { Metadata } from "next";
import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmEmail?: string }>;
}) {
  const { confirmEmail } = await searchParams;
  return <LoginForm justSignedUp={confirmEmail === "1"} />;
}
