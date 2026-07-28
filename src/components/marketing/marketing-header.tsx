import { getCurrentProfile } from "@/lib/queries/profile";
import { MarketingHeaderClient } from "@/components/marketing/marketing-header-client";

export async function MarketingHeader() {
  const profile = await getCurrentProfile();

  return (
    <MarketingHeaderClient
      profile={
        profile
          ? {
              fullName: profile.fullName,
              accountType: profile.accountType,
              isPlatformAdmin: profile.isPlatformAdmin,
              avatarUrl: profile.avatarUrl,
            }
          : null
      }
    />
  );
}
