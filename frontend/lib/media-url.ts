/** Resolve API media paths to absolute URLs for next/image. */
export function resolveMediaUrl(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  return `${base}${src.startsWith("/") ? src : `/${src}`}`;
}
