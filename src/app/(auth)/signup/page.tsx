import type { Metadata } from "next";
import { SignupForm } from "@/app/(auth)/signup/signup-form";

export const metadata: Metadata = {
  title: "Create your account",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  return (
    <SignupForm
      initialAccountType={type === "organization" ? "organization" : "individual"}
    />
  );
}
