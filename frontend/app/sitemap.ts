import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL || "https://friendinme.pmediaplus.com";
const API = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/perros`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/cuestionario`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const res = await fetch(`${API}/api/dogs`, { next: { revalidate: 3600 } });
    if (!res.ok) return staticRoutes;
    const dogs = (await res.json()) as { id: number; updated_at?: string }[];
    const dogRoutes: MetadataRoute.Sitemap = dogs.map((d) => ({
      url: `${BASE}/perros/${d.id}`,
      lastModified: d.updated_at ? new Date(d.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [...staticRoutes, ...dogRoutes];
  } catch {
    return staticRoutes;
  }
}
