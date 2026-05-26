/** Opciones compartidas para filtros de listado y cuestionario. */

export const AGE_FILTER_OPTIONS = [
  { value: "puppy", label: "Cachorro (hasta 1 año)" },
  { value: "young", label: "Joven (1-3 años)" },
  { value: "adult", label: "Adulto (3-7 años)" },
  { value: "senior", label: "Senior (7 años o más)" },
];

export const AGE_LABELS_SHORT: Record<string, string> = {
  puppy: "Cachorro",
  young: "Joven",
  adult: "Adulto",
  senior: "Senior",
};

const PUPPY_MAX_MONTHS = 12;
const YOUNG_MAX_MONTHS = 36;
const ADULT_MAX_MONTHS = 83;

/** Misma lógica que el backend (age_preferences.py). */
export function estimateAgeMonths(ageEstimate: string): number | null {
  const text = (ageEstimate || "").toLowerCase().trim();
  if (!text) return null;
  const unitMatch = text.match(/(\d+)\s*(mes(?:es)?|año|anos|year)/);
  if (unitMatch) {
    const n = Number(unitMatch[1]);
    const unit = unitMatch[2];
    if (unit.startsWith("mes")) return n;
    return n * 12;
  }
  const nMatch = text.match(/(\d+)/);
  if (!nMatch) return null;
  const n = Number(nMatch[1]);
  return n <= 20 ? n * 12 : null;
}

export function ageStageKey(ageEstimate: string): keyof typeof AGE_LABELS_SHORT | null {
  const months = estimateAgeMonths(ageEstimate);
  if (months === null) return null;
  if (months <= PUPPY_MAX_MONTHS) return "puppy";
  if (months <= YOUNG_MAX_MONTHS) return "young";
  if (months <= ADULT_MAX_MONTHS) return "adult";
  return "senior";
}

/** Texto para etiqueta en ficha: «2 años · Joven». */
export function formatAgeForCard(ageEstimate: string | null | undefined): string | null {
  const raw = (ageEstimate || "").trim();
  if (!raw) return null;
  const stage = ageStageKey(raw);
  if (stage) return `${raw} · ${AGE_LABELS_SHORT[stage]}`;
  return raw;
}
