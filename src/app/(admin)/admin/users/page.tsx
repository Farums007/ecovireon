import Link from "next/link";
import { listAllUsers } from "@/lib/queries/admin";
import { getCurrentProfile } from "@/lib/queries/profile";
import { UserRowActions } from "@/app/(admin)/admin/users/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const FILTERS = [
  { value: undefined, label: "All" },
  { value: "individual", label: "Individuals" },
  { value: "organization", label: "Organizations" },
] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const accountType = type === "individual" || type === "organization" ? type : undefined;
  const [users, currentProfile] = await Promise.all([
    listAllUsers(accountType),
    getCurrentProfile(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">{users.length} accounts.</p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter users">
        {FILTERS.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/users?type=${f.value}` : "/admin/users"}
            role="tab"
            aria-selected={accountType === f.value}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              accountType === f.value
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card className="border-border/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Org / Role</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Trees</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {(user.fullName || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-foreground">
                        {user.fullName || "—"}
                      </span>
                      {user.isPlatformAdmin && (
                        <Badge variant="secondary">Platform admin</Badge>
                      )}
                      {user.isBanned && <Badge variant="destructive">Banned</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.accountType === "organization" ? "outline" : "secondary"}
                      className="capitalize"
                    >
                      {user.accountType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.organizationName
                      ? `${user.organizationName} (${user.role})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.country ?? "—"}</TableCell>
                  <TableCell className="font-medium">{user.treesPlantedCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {currentProfile && currentProfile.id !== user.id && (
                      <UserRowActions
                        userId={user.id}
                        userName={user.fullName}
                        isBanned={user.isBanned}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
