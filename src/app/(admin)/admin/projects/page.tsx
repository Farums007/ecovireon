import { listAllProjectsForAdmin } from "@/lib/queries/admin";
import { DeleteProjectButton } from "@/app/(admin)/admin/projects/delete-project-button";
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

const TYPE_LABELS: Record<string, string> = {
  restoration: "Restoration",
  conservation: "Conservation",
  urban_forestry: "Urban forestry",
  carbon: "Carbon-ready",
};

export default async function AdminProjectsPage() {
  const projects = await listAllProjectsForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="mt-1 text-muted-foreground">
          {projects.length} project{projects.length === 1 ? "" : "s"} across every organization.
        </p>
      </div>

      <Card className="border-border/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Name</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium text-foreground">{project.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {project.organizationName}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {TYPE_LABELS[project.projectType] ?? project.projectType}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.isPublic ? (
                      <Badge variant="secondary">Public</Badge>
                    ) : (
                      <span className="text-muted-foreground">Private</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DeleteProjectButton projectId={project.id} projectName={project.name} />
                    </div>
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
