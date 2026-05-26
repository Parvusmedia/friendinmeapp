export type LeadStatusValue =
  | "new"
  | "contacted"
  | "in_process"
  | "adopted"
  | "rejected"
  | "archived"
  | "cancelled";

export const LEAD_STATUS_LABELS: Record<string, string> = {
  new: "Enviada — pendiente de respuesta",
  contacted: "El refugio te ha contactado",
  in_process: "En proceso de adopción",
  adopted: "Adopción completada",
  rejected: "No procede",
  archived: "Archivada",
  cancelled: "Cancelada por ti",
};

export function leadStatusLabel(status: string): string {
  return LEAD_STATUS_LABELS[status] ?? status;
}

export function leadStatusShort(status: string): string {
  const short: Record<string, string> = {
    new: "Pendiente",
    contacted: "Respondida",
    in_process: "En proceso",
    adopted: "Adoptado",
    rejected: "Rechazada",
    archived: "Archivada",
    cancelled: "Cancelada",
  };
  return short[status] ?? status;
}

export function canAdopterCancel(status: string): boolean {
  return status === "new" || status === "contacted" || status === "in_process";
}

export function isLeadBlockingNewRequest(status: string): boolean {
  return ["new", "contacted", "in_process", "adopted", "rejected"].includes(status);
}

export function leadStatusTagClass(status: string): string {
  switch (status) {
    case "new":
      return "tag tag--lead-new";
    case "contacted":
    case "in_process":
      return "tag tag--lead-active";
    case "adopted":
      return "tag tag--lead-success";
    case "cancelled":
    case "archived":
      return "tag tag--lead-muted";
    case "rejected":
      return "tag tag--lead-rejected";
    default:
      return "tag";
  }
}
