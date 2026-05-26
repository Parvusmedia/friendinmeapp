export type MatchLevel = "excellent" | "good" | "possible" | "risky";

export function matchLevelLabel(level: string): string {
  const map: Record<string, string> = {
    excellent: "Excelente encaje",
    good: "Buen encaje",
    possible: "Encaje moderado",
    risky: "Encaje bajo",
  };
  return map[level] ?? "Compatibilidad orientativa";
}

export function matchLevelHeadline(level: string, dogName: string): string {
  const map: Record<string, string> = {
    excellent: `Compatibilidad muy favorable. ${dogName} encaja muy bien con tu perfil.`,
    good: `Compatibilidad favorable. ${dogName} podría encajar bien en tu hogar.`,
    possible: `Compatibilidad moderada. Conoce a ${dogName} y valora con el refugio si encaja.`,
    risky: `Hay aspectos a revisar antes de adoptar a ${dogName}. Consulta siempre al refugio.`,
  };
  return map[level] ?? `Análisis orientativo para ${dogName}.`;
}

export function breakdownStatusLabel(percent: number, status: string): string {
  if (status === "risk") return "Revisar";
  if (status === "warn") return "Atención";
  if (percent >= 85) return "Excelente encaje";
  if (percent >= 75) return "Muy buen encaje";
  if (percent >= 60) return "Buen encaje";
  return "Encaje moderado";
}

export const BREAKDOWN_ICONS: Record<string, string> = {
  housing: "🏠",
  experience: "🎓",
  family: "👨‍👩‍👧",
  energy: "🏃",
  location: "📍",
};
