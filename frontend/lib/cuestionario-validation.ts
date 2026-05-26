export type CuestionarioForm = {
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  consent_contact: boolean;
  preferred_sizes: string[];
  preferred_energy: string;
  preferred_age_ranges: string[];
  breed_preferences: string[];
};

export function validateFormStep(
  step: number,
  form: CuestionarioForm,
  opts?: { requireMatchFilters?: boolean; skipDogPrefs?: boolean }
): string[] {
  const errors: string[] = [];
  if (step === 0 && !opts?.skipDogPrefs) {
    if (opts?.requireMatchFilters) {
      const hasSize = form.preferred_sizes.length > 0;
      const hasEnergy = form.preferred_energy !== "no_preference";
      if (!hasSize && !hasEnergy) {
        errors.push("Indica al menos un tamaño o un nivel de energía para acotar el análisis.");
      }
    }
  }
  if (step === 1) {
    if (!form.name.trim()) errors.push("Indica tu nombre.");
    if (!form.phone.trim()) errors.push("Indica tu teléfono.");
    if (!form.province.trim()) errors.push("Indica la provincia de tu vivienda.");
    if (!form.city.trim()) errors.push("Indica tu ciudad.");
  }
  if (step === 3) {
    if (!form.consent_contact) {
      errors.push("Debes marcar el consentimiento para que el refugio pueda contactarte.");
    }
  }
  return errors;
}

export function validateAllFormSteps(
  form: CuestionarioForm,
  opts?: { requireMatchFilters?: boolean; skipDogPrefs?: boolean }
): string[] {
  const errors: string[] = [];
  for (let s = 0; s < 4; s++) {
    errors.push(...validateFormStep(s, form, opts));
  }
  return errors;
}

export function validateEmail(email: string): string[] {
  const e = email.trim();
  if (!e) return ["Introduce tu email."];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return ["El email no parece válido."];
  return [];
}
