/**
 * Espacios publicitarios / partners (config estática; luego puede venir de API o CMS).
 */

import { ageStageKey, formatAgeForCard } from "./dog-filters";
import { energyLabelEs, sizeLabelEs } from "./dog-display";

export const PARTNER_PLACEMENTS_ENABLED = true;

export type PartnerPlacementId =
  | "dog_detail_footer"
  | "match_after_summary"
  | "lead_success"
  | "lead_list_pending";

export type PartnerDogContext = {
  dogId?: number;
  dogName?: string;
  breed?: string;
  size?: string;
  energy_level?: string;
  age_estimate?: string;
};

export type PartnerCampaign = {
  id: string;
  placement: PartnerPlacementId;
  active: boolean;
  priority: number;
  sponsorName: string;
  icon?: string;
  headline: string;
  body: string;
  bullets?: string[];
  ctaLabel: string;
  ctaUrl: string;
  discountCode?: string;
  discountNote?: string;
  /** Si se define, solo se muestra cuando el perro cumple alguna regla */
  match?: {
    sizes?: string[];
    energy_levels?: string[];
    age_stages?: string[];
  };
};

export type ResolvedPartnerCampaign = PartnerCampaign & {
  headline: string;
  body: string;
  bullets?: string[];
  discountNote?: string;
};

function interpolate(text: string, ctx: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => ctx[key] ?? `{${key}}`);
}

export function buildPartnerContext(dog: PartnerDogContext): Record<string, string> {
  const ageLabel = dog.age_estimate ? formatAgeForCard(dog.age_estimate) ?? dog.age_estimate : "";
  const stage = dog.age_estimate ? ageStageKey(dog.age_estimate) : null;
  return {
    dogName: dog.dogName ?? "tu perro",
    breed: dog.breed ?? "su raza",
    sizeLabel: dog.size ? sizeLabelEs(dog.size) : "su tamaño",
    energyLabel: dog.energy_level ? energyLabelEs(dog.energy_level) : "su energía",
    ageLabel: ageLabel || "su edad",
    ageStage: stage ?? "",
    productName: productHint(dog),
  };
}

/** Sugerencia genérica de producto según perfil (placeholder hasta partner real). */
function productHint(dog: PartnerDogContext): string {
  const e = dog.energy_level;
  if (e === "high") return "NutriActive (alta energía)";
  if (e === "low") return "NutriCalm (baja energía)";
  if (dog.size === "small") return "NutriSmall";
  if (dog.size === "large") return "NutriLarge";
  return "NutriFriend (equilibrada)";
}

function campaignMatches(campaign: PartnerCampaign, dog: PartnerDogContext): boolean {
  const rules = campaign.match;
  if (!rules) return true;
  if (rules.sizes?.length && dog.size && !rules.sizes.includes(dog.size)) return false;
  if (rules.energy_levels?.length && dog.energy_level && !rules.energy_levels.includes(dog.energy_level)) {
    return false;
  }
  if (rules.age_stages?.length && dog.age_estimate) {
    const stage = ageStageKey(dog.age_estimate);
    if (stage && !rules.age_stages.includes(stage)) return false;
  }
  return true;
}

export function resolvePartnerCampaign(
  placement: PartnerPlacementId,
  dog: PartnerDogContext = {}
): ResolvedPartnerCampaign | null {
  if (!PARTNER_PLACEMENTS_ENABLED) return null;

  const vars = buildPartnerContext(dog);
  const candidates = PARTNER_CAMPAIGNS.filter(
    (c) => c.active && c.placement === placement && campaignMatches(c, dog)
  ).sort((a, b) => b.priority - a.priority);

  const picked = candidates[0];
  if (!picked) return null;

  const allVars = { ...vars, discountCode: picked.discountCode ?? "" };
  return {
    ...picked,
    headline: interpolate(picked.headline, vars),
    body: interpolate(picked.body, vars),
    bullets: picked.bullets?.map((b) => interpolate(b, vars)),
    discountNote: picked.discountNote ? interpolate(picked.discountNote, allVars) : undefined,
  };
}

/** Campañas de ejemplo — sustituir ctaUrl y copy por partners reales. */
export const PARTNER_CAMPAIGNS: PartnerCampaign[] = [
  {
    id: "food-dog-detail",
    placement: "dog_detail_footer",
    active: true,
    priority: 10,
    sponsorName: "NutriFriend",
    icon: "🍽️",
    headline: "Para {dogName}, por su edad, energía y raza",
    body: "Te recomendamos una alimentación tipo {productName}, adaptada a perros {sizeLabel}s con energía {energyLabel}.",
    bullets: [
      "Pienso o húmedo según preferencias del refugio y del veterinario",
      "Con FriendInMe: 10 % en tu primer pedido con código FRIEND10",
      "Suscripción mensual a domicilio: sin preocuparte de la compra",
    ],
    ctaLabel: "Ver opciones de alimentación",
    ctaUrl: "https://example.com/nutrifriend?utm_source=friendinme&utm_placement=dog_detail",
    discountCode: "FRIEND10",
    discountNote: "10 % de descuento en el primer pedido · Código {discountCode}",
  },
  {
    id: "kit-match",
    placement: "match_after_summary",
    active: true,
    priority: 10,
    sponsorName: "PetHome Kit",
    icon: "📦",
    headline: "Prepara el hogar antes de la visita",
    body: "Si el encaje con {dogName} encaja, un kit básico (comedero, manta, arnés según {sizeLabel}) facilita los primeros días.",
    bullets: ["Envío en 48 h", "Guía de llegada incluida"],
    ctaLabel: "Ver kit de bienvenida",
    ctaUrl: "https://example.com/pethome-kit?utm_source=friendinme&utm_placement=match",
  },
  {
    id: "food-lead-success",
    placement: "lead_success",
    active: true,
    priority: 10,
    sponsorName: "NutriFriend",
    icon: "🐾",
    headline: "Mientras el refugio te contacta sobre {dogName}",
    body: "Puedes ir preparando la alimentación: {productName} para un perro {sizeLabel} ({ageLabel}).",
    bullets: [
      "10 % de descuento con FriendInMe (FRIEND10)",
      "Suscripción mensual a casa: comida lista cada mes",
    ],
    ctaLabel: "Activar oferta",
    ctaUrl: "https://example.com/nutrifriend?utm_source=friendinme&utm_placement=lead_success",
    discountCode: "FRIEND10",
  },
  {
    id: "insurance-lead-list",
    placement: "lead_list_pending",
    active: true,
    priority: 5,
    sponsorName: "SeguroMascota",
    icon: "🛡️",
    headline: "Protege a {dogName} desde el primer día",
    body: "Responsabilidad civil y asistencia veterinaria básica mientras avanza tu solicitud.",
    ctaLabel: "Simular seguro",
    ctaUrl: "https://example.com/seguro?utm_source=friendinme&utm_placement=lead_list",
  },
];
