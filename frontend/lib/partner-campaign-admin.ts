import type { PartnerPlacementId } from "./partner-placements";

export type PartnerCampaignAdmin = {
  id: number;
  name: string;
  placement: string;
  active: boolean;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  sponsor_name: string;
  icon: string | null;
  headline: string;
  body: string;
  bullets: string[];
  cta_label: string;
  cta_url: string;
  discount_code: string | null;
  discount_note: string | null;
  match_sizes: string[] | null;
  match_energy_levels: string[] | null;
  match_age_stages: string[] | null;
  created_at: string;
  updated_at: string;
};

export type PartnerCampaignForm = {
  name: string;
  placement: PartnerPlacementId;
  active: boolean;
  priority: number;
  starts_at: string;
  ends_at: string;
  sponsor_name: string;
  icon: string;
  headline: string;
  body: string;
  bulletsText: string;
  cta_label: string;
  cta_url: string;
  discount_code: string;
  discount_note: string;
  match_sizes: string;
  match_energy_levels: string;
  match_age_stages: string;
};

export const EMPTY_CAMPAIGN_FORM: PartnerCampaignForm = {
  name: "",
  placement: "dog_detail_footer",
  active: true,
  priority: 10,
  starts_at: "",
  ends_at: "",
  sponsor_name: "",
  icon: "",
  headline: "",
  body: "",
  bulletsText: "",
  cta_label: "",
  cta_url: "",
  discount_code: "",
  discount_note: "",
  match_sizes: "",
  match_energy_levels: "",
  match_age_stages: "",
};

export function campaignToForm(c: PartnerCampaignAdmin): PartnerCampaignForm {
  return {
    name: c.name,
    placement: c.placement as PartnerPlacementId,
    active: c.active,
    priority: c.priority,
    starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
    ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
    sponsor_name: c.sponsor_name,
    icon: c.icon ?? "",
    headline: c.headline,
    body: c.body,
    bulletsText: (c.bullets ?? []).join("\n"),
    cta_label: c.cta_label,
    cta_url: c.cta_url,
    discount_code: c.discount_code ?? "",
    discount_note: c.discount_note ?? "",
    match_sizes: (c.match_sizes ?? []).join(", "),
    match_energy_levels: (c.match_energy_levels ?? []).join(", "),
    match_age_stages: (c.match_age_stages ?? []).join(", "),
  };
}

function splitCsv(s: string): string[] | null {
  const parts = s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

function toIsoOrNull(localDatetime: string): string | null {
  if (!localDatetime.trim()) return null;
  const d = new Date(localDatetime);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function formToPayload(form: PartnerCampaignForm) {
  return {
    name: form.name.trim(),
    placement: form.placement,
    active: form.active,
    priority: Number(form.priority) || 0,
    starts_at: toIsoOrNull(form.starts_at),
    ends_at: toIsoOrNull(form.ends_at),
    sponsor_name: form.sponsor_name.trim(),
    icon: form.icon.trim() || null,
    headline: form.headline.trim(),
    body: form.body.trim(),
    bullets: form.bulletsText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    cta_label: form.cta_label.trim(),
    cta_url: form.cta_url.trim(),
    discount_code: form.discount_code.trim() || null,
    discount_note: form.discount_note.trim() || null,
    match_sizes: splitCsv(form.match_sizes),
    match_energy_levels: splitCsv(form.match_energy_levels),
    match_age_stages: splitCsv(form.match_age_stages),
  };
}

export function campaignScheduleLabel(c: PartnerCampaignAdmin): string {
  const now = Date.now();
  if (!c.active) return "Desactivada";
  if (c.starts_at && new Date(c.starts_at).getTime() > now) return "Programada";
  if (c.ends_at && new Date(c.ends_at).getTime() < now) return "Finalizada";
  return "Activa";
}
