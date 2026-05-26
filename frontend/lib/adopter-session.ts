import { apiFetch } from "./api";

export const ADOPTER_ID_KEY = "fi_adopter_id";
export const ADOPTER_EMAIL_KEY = "fi_adopter_email";

export type AdopterProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  housing_type: string;
  has_children: boolean;
  children_age_range: string | null;
  has_other_dogs: boolean;
  has_cats: boolean;
  previous_dog_experience: string;
  hours_away_from_home: string;
  activity_level: string;
  preferred_sizes: string[];
  preferred_age_ranges: string[];
  preferred_energy: string;
  adoption_reason: string;
  important_notes: string;
  province_preference: string;
  breed_preferences: string[];
  max_distance_km: number | null;
  consent_marketing: boolean;
  consent_contact: boolean;
};

export function getStoredAdopterId(): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADOPTER_ID_KEY) || sessionStorage.getItem(ADOPTER_ID_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function getStoredAdopterEmail(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADOPTER_EMAIL_KEY) || sessionStorage.getItem(ADOPTER_EMAIL_KEY);
}

export function persistAdopterSession(id: number, email: string) {
  localStorage.setItem(ADOPTER_ID_KEY, String(id));
  localStorage.setItem(ADOPTER_EMAIL_KEY, email.trim().toLowerCase());
  sessionStorage.setItem(ADOPTER_ID_KEY, String(id));
}

export function clearAdopterSession() {
  localStorage.removeItem(ADOPTER_ID_KEY);
  localStorage.removeItem(ADOPTER_EMAIL_KEY);
  sessionStorage.removeItem(ADOPTER_ID_KEY);
}

export async function fetchAdopterById(id: number): Promise<AdopterProfile | null> {
  try {
    return (await apiFetch(`/api/adopters/${id}`)) as AdopterProfile;
  } catch {
    return null;
  }
}

export async function lookupAdopterByEmail(email: string): Promise<AdopterProfile | null> {
  const res = (await apiFetch("/api/adopters/lookup", {
    method: "POST",
    body: JSON.stringify({ email: email.trim() }),
  })) as { found: boolean; profile: AdopterProfile | null };
  return res.found && res.profile ? res.profile : null;
}

/** Recupera el perfil guardado en este navegador (id o email). */
export async function resolveStoredAdopter(): Promise<AdopterProfile | null> {
  const id = getStoredAdopterId();
  if (id) {
    const profile = await fetchAdopterById(id);
    if (profile) {
      persistAdopterSession(profile.id, profile.email);
      return profile;
    }
  }
  const email = getStoredAdopterEmail();
  if (email) {
    const profile = await lookupAdopterByEmail(email);
    if (profile) {
      persistAdopterSession(profile.id, profile.email);
      return profile;
    }
  }
  return null;
}

export async function runMatchForDog(
  adopterId: number,
  dogId: number
): Promise<{ compatibility_score: number; results: unknown[] }> {
  const match = (await apiFetch("/api/matches", {
    method: "POST",
    body: JSON.stringify({
      adopter_profile_id: adopterId,
      top_n: 1,
      use_ai: true,
      dog_id: dogId,
    }),
  })) as { results: { dog_id: number; compatibility_score: number }[] };
  const row = match.results.find((r) => r.dog_id === dogId) ?? match.results[0];
  const score = row?.compatibility_score ?? 0;
  sessionStorage.setItem("fi_last_match", JSON.stringify(match));
  return { compatibility_score: score, results: match.results };
}
