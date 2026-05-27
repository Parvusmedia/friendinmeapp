import { apiFetch } from "./api";

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

export type ResolvedPartnerCampaign = {
  id: number;
  placement: string;
  sponsor_name: string;
  icon: string | null;
  headline: string;
  body: string;
  bullets: string[];
  cta_label: string;
  cta_url: string;
  discount_code: string | null;
  discount_note: string | null;
};

export const PLACEMENT_LABELS: Record<PartnerPlacementId, string> = {
  dog_detail_footer: "Ficha del perro (pie)",
  match_after_summary: "Resultados de compatibilidad",
  lead_success: "Solicitud enviada",
  lead_list_pending: "Mis solicitudes (pendiente)",
};

export async function fetchResolvedPartnerCampaign(
  placement: PartnerPlacementId,
  context: PartnerDogContext = {}
): Promise<ResolvedPartnerCampaign | null> {
  const q = new URLSearchParams({ placement });
  if (context.dogId) q.set("dog_id", String(context.dogId));
  if (context.dogName) q.set("dog_name", context.dogName);
  try {
    const res = await apiFetch(`/api/partner-campaigns/resolve?${q.toString()}`);
    return res as ResolvedPartnerCampaign | null;
  } catch {
    return null;
  }
}
