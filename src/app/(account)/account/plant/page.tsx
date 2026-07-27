import { PlantTreeForm } from "@/app/(account)/account/plant/plant-tree-form";

export default function PlantTreePage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plant a tree</h1>
        <p className="mt-1 text-muted-foreground">
          Log a tree you&apos;ve planted — it&apos;s yours forever once
          verified.
        </p>
      </div>
      <PlantTreeForm />
    </div>
  );
}
