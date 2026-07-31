"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DeleteProjectState = { error: string } | null;

export async function deleteProjectAsAdmin(
  projectId: string,
  _prevState: DeleteProjectState,
  _formData: FormData
): Promise<DeleteProjectState> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) {
    return {
      error: error.message.includes("foreign key")
        ? "This project can't be deleted while it still has donations attached to it."
        : error.message,
    };
  }

  revalidatePath("/admin/projects");
  revalidatePath("/admin");
  return null;
}
