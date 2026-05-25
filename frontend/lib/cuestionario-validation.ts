export type CuestionarioForm = {
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  consent_contact: boolean;
  preferred_sizes: string[];
  breed_preferences: string[];
};

export function validateFormStep(step: number, form: CuestionarioForm): string[] {
  const errors: string[] = [];
  if (step === 0) {
    if (!form.name.trim()) errors.push("Indica tu nombre.");
    if (!form.phone.trim()) errors.push("Indica tu teléfono.");
    if (!form.province.trim()) errors.push("Indica la provincia de tu vivienda.");
    if (!form.city.trim()) errors.push("Indica tu ciudad.");
  }
  if (step === 2) {
    if (!form.consent_contact) {
      errors.push("Debes marcar el consentimiento para que el refugio pueda contactarte.");
    }
  }
  return errors;
}

export function validateAllFormSteps(form: CuestionarioForm): string[] {
  const errors: string[] = [];
  for (let s = 0; s < 3; s++) {
    errors.push(...validateFormStep(s, form));
  }
  return errors;
}

export function validateEmail(email: string): string[] {
  const e = email.trim();
  if (!e) return ["Introduce tu email."];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return ["El email no parece válido."];
  return [];
}
