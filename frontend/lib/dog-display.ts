import { AGE_LABELS_SHORT, ageStageKey, formatAgeForCard } from "./dog-filters";

const SIZE_ES: Record<string, string> = { small: "Pequeño", medium: "Mediano", large: "Grande" };
const ENERGY_ES: Record<string, string> = { low: "Baja", medium: "Media", high: "Alta" };
const STATUS_ES: Record<string, string> = {
  available: "Disponible",
  reserved: "Reservada",
  adopted: "Adoptado",
};

export function sizeLabelEs(size: string): string {
  return SIZE_ES[size] ?? size;
}

export function energyLabelEs(energy: string): string {
  return ENERGY_ES[energy] ?? energy;
}

export function statusLabelEs(status: string): string {
  return STATUS_ES[status] ?? status;
}

export function parseBulletLines(text: string): string[] {
  if (!text.trim()) return [];
  return text
    .split(/\n+/)
    .map((line) => line.replace(/^[\s•\-✓*]+\s*/, "").trim())
    .filter(Boolean);
}

export function buildProfileTags(dog: {
  status: string;
  energy_level: string;
  age_estimate: string;
  behaviour_notes?: string;
}): string[] {
  const tags: string[] = [];
  if (dog.status === "reserved") tags.push("Reservada");
  const stage = ageStageKey(dog.age_estimate);
  if (stage === "senior") tags.push("Especial senior");
  if (dog.energy_level === "low") tags.push("Tranquila");
  else if (dog.energy_level === "high") tags.push("Muy activa");
  const notes = (dog.behaviour_notes || "").toLowerCase();
  if (notes.includes("cariñ") || notes.includes("carin")) tags.push("Cariñosa");
  if (notes.includes("lent") || notes.includes("adapt")) tags.push("Adaptación lenta");
  if (tags.length < 2 && dog.status === "available") tags.push("En adopción");
  return Array.from(new Set(tags)).slice(0, 5);
}

export function buildKnowTags(dog: {
  size: string;
  energy_level: string;
  medical_needs?: string;
  can_live_in_apartment?: string;
}): { icon: string; label: string }[] {
  const out: { icon: string; label: string }[] = [];
  out.push({
    icon: "⚡",
    label: dog.energy_level === "low" ? "Energía baja" : dog.energy_level === "high" ? "Energía alta" : "Energía media",
  });
  out.push({
    icon: "🐕",
    label: dog.size === "small" ? "Tamaño pequeño" : dog.size === "large" ? "Tamaño grande" : "Tamaño mediano",
  });
  if (dog.can_live_in_apartment === "yes" || dog.can_live_in_apartment === "maybe") {
    out.push({ icon: "🛋️", label: "Convivencia tranquila" });
  } else {
    out.push({ icon: "🏠", label: "Hogar con espacio" });
  }
  const med = (dog.medical_needs || "").toLowerCase();
  if (med.includes("aliment") || med.includes("dieta") || med.includes("bland")) {
    out.push({ icon: "🥣", label: "Alimentación especial" });
  } else if (med) {
    out.push({ icon: "🩺", label: "Seguimiento veterinario" });
  }
  return out;
}

export { formatAgeForCard, AGE_LABELS_SHORT };
