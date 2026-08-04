function publicStorageUrl(bucket: string, path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}

export function getTreePhotoUrl(path: string): string {
  return publicStorageUrl("tree-photos", path);
}

export function getAvatarUrl(path: string): string {
  return publicStorageUrl("avatars", path);
}

export function getOrgLogoUrl(path: string): string {
  return publicStorageUrl("org-logos", path);
}
