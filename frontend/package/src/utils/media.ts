/**
 * Helper utility to build absolute media URLs for Django-hosted uploads
 * (e.g. passport photos, document uploads, etc.)
 */
export function getMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  
  const trimmed = path.trim();
  if (!trimmed) return undefined;

  // Already a full URL (http/https) or base64 data URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Base API Host (without /api suffix)
  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    process.env.DJANGO_API_URL?.replace(/\/api\/?$/, "") ||
    "http://127.0.0.1:8000";

  if (trimmed.startsWith("/")) {
    return `${apiBase}${trimmed}`;
  }

  if (trimmed.startsWith("media/")) {
    return `${apiBase}/${trimmed}`;
  }

  return `${apiBase}/media/${trimmed}`;
}
