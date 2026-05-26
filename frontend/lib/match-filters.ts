/** Filtros del listado → cuestionario / match (sessionStorage + query). */

export type ListingMatchFilters = {
  size?: string;
  energy_level?: string;
  province?: string;
  breed?: string;
  age?: string;
};

const STORAGE_KEY = "fi_listing_filters";

export function saveListingFilters(filters: ListingMatchFilters): void {
  if (typeof window === "undefined") return;
  const clean = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && String(v).trim() !== "")
  ) as ListingMatchFilters;
  if (Object.keys(clean).length === 0) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
}

export function readListingFilters(): ListingMatchFilters | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ListingMatchFilters;
  } catch {
    return null;
  }
}

export function clearListingFilters(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function filtersFromSearchParams(sp: URLSearchParams): ListingMatchFilters {
  const out: ListingMatchFilters = {};
  const size = sp.get("size");
  const energy = sp.get("energy") || sp.get("energy_level");
  const province = sp.get("province");
  const breed = sp.get("breed");
  const age = sp.get("age");
  if (size) out.size = size;
  if (energy) out.energy_level = energy;
  if (province) out.province = province;
  if (breed) out.breed = breed;
  if (age) out.age = age;
  return out;
}

export function hasListingFilters(f: ListingMatchFilters | null | undefined): boolean {
  if (!f) return false;
  return Boolean(f.size || f.energy_level || f.province || f.breed || f.age);
}

export function cuestionarioHref(filters?: ListingMatchFilters | null, dogId?: string | null): string {
  const q = new URLSearchParams();
  if (dogId) q.set("dog", dogId);
  if (filters?.size) q.set("size", filters.size);
  if (filters?.energy_level) q.set("energy", filters.energy_level);
  if (filters?.province) q.set("province", filters.province);
  if (filters?.breed) q.set("breed", filters.breed);
  if (filters?.age) q.set("age", filters.age);
  if (hasListingFilters(filters)) q.set("from", "listing");
  const qs = q.toString();
  return qs ? `/cuestionario?${qs}` : "/cuestionario";
}

export function buildListingFiltersFromListingState(
  province: string,
  breed: string,
  size: string,
  energy: string,
  age: string
): ListingMatchFilters {
  const f: ListingMatchFilters = {};
  if (province) f.province = province;
  if (breed) f.breed = breed;
  if (size) f.size = size;
  if (energy) f.energy_level = energy;
  if (age) f.age = age;
  return f;
}
