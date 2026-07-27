import { listAllUsers } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage() {
  const users = await listAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">{users.length} accounts.</p>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
