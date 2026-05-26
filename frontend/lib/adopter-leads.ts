import { apiFetch } from "./api";

export type AdopterLead = {
  id: number;
  adopter_profile_id: number;
  dog_id: number;
  shelter_id: number;
  name: string;
  email: string;
  phone: string;
  province: string;
  message: string;
  compatibility_score: number;
  status: string;
  created_at: string;
  updated_at: string;
  dog_name: string;
  dog_main_image_url: string | null;
  shelter_name: string;
};

export async function checkLeadForDog(
  adopterId: number,
  email: string,
  dogId: number
): Promise<{ exists: boolean; lead: AdopterLead | null }> {
  const q = new URLSearchParams({
    adopter_profile_id: String(adopterId),
    dog_id: String(dogId),
    email: email.trim(),
  });
  return apiFetch(`/api/leads/check?${q.toString()}`) as Promise<{ exists: boolean; lead: AdopterLead | null }>;
}

export async function fetchAdopterLeads(adopterId: number, email: string): Promise<AdopterLead[]> {
  const q = new URLSearchParams({ email: email.trim() });
  return apiFetch(`/api/leads/adopter/${adopterId}?${q.toString()}`) as Promise<AdopterLead[]>;
}

export async function cancelAdopterLead(leadId: number, adopterId: number, email: string): Promise<AdopterLead> {
  return apiFetch(`/api/leads/${leadId}/cancel`, {
    method: "POST",
    body: JSON.stringify({ adopter_profile_id: adopterId, email: email.trim() }),
  }) as Promise<AdopterLead>;
}
