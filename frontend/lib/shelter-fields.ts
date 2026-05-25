export const EMPTY_SHELTER_FORM = {
  name: "",
  email: "",
  phone: "",
  province: "",
  city: "",
  address: "",
  description: "",
  website: "",
  instagram: "",
  contact_person: "",
  contact_mobile: "",
  whatsapp: "",
};

export type ShelterFormState = typeof EMPTY_SHELTER_FORM;

export const SHELTER_TEXT_FIELDS: {
  key: keyof ShelterFormState;
  label: string;
  required?: boolean;
  type?: "email" | "tel" | "text";
  placeholder?: string;
}[] = [
  { key: "name", label: "Nombre", required: true },
  { key: "email", label: "Email del refugio", required: true, type: "email" },
  { key: "phone", label: "Teléfono del refugio", required: true, type: "tel" },
  { key: "whatsapp", label: "WhatsApp del refugio", type: "tel", placeholder: "+34 600 000 000" },
  { key: "contact_person", label: "Persona de contacto" },
  { key: "contact_mobile", label: "Móvil persona de contacto", type: "tel" },
  { key: "instagram", label: "Instagram", placeholder: "@refugio o URL" },
  { key: "province", label: "Provincia", required: true },
  { key: "city", label: "Ciudad", required: true },
  { key: "address", label: "Dirección" },
  { key: "website", label: "Web" },
];

export function shelterToForm(s: {
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  address?: string | null;
  description?: string;
  website?: string | null;
  instagram?: string;
  contact_person?: string;
  contact_mobile?: string;
  whatsapp?: string;
}): ShelterFormState {
  return {
    name: s.name,
    email: s.email,
    phone: s.phone,
    province: s.province,
    city: s.city,
    address: s.address || "",
    description: s.description || "",
    website: s.website || "",
    instagram: s.instagram || "",
    contact_person: s.contact_person || "",
    contact_mobile: s.contact_mobile || "",
    whatsapp: s.whatsapp || "",
  };
}

export function shelterPayload(form: ShelterFormState) {
  return {
    ...form,
    address: form.address || null,
    website: form.website || null,
    instagram: form.instagram.trim(),
    contact_person: form.contact_person.trim(),
    contact_mobile: form.contact_mobile.trim(),
    whatsapp: form.whatsapp.trim(),
  };
}
