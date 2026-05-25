/** Build wa.me link from phone digits (Spain-friendly). */
export function whatsappUrl(phone: string, message: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return null;
  const normalized = digits.startsWith("34") ? digits : `34${digits}`;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
