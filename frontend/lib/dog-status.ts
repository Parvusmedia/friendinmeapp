/** Estado de publicación del perro (API: DogStatus). Solo `available` se muestra en la web pública. */

export type DogStatusValue = "available" | "reserved" | "adopted" | "hidden";

export const DOG_STATUS_OPTIONS: { value: DogStatusValue; label: string; hint: string }[] = [
  {
    value: "available",
    label: "Disponible",
    hint: "Visible en la web y en búsquedas de adoptantes",
  },
  {
    value: "reserved",
    label: "Reservado",
    hint: "No se publica; proceso de adopción en curso",
  },
  {
    value: "adopted",
    label: "Adoptado",
    hint: "No se publica; ya tiene familia",
  },
  {
    value: "hidden",
    label: "Oculto",
    hint: "No se publica; borrador o pausado",
  },
];

export function dogStatusLabel(status: string): string {
  return DOG_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function isDogPublished(status: string): boolean {
  return status === "available";
}

export function dogStatusTagClass(status: string): string {
  switch (status) {
    case "available":
      return "tag tag--status-available";
    case "reserved":
      return "tag tag--status-reserved";
    case "adopted":
      return "tag tag--status-adopted";
    case "hidden":
      return "tag tag--status-hidden";
    default:
      return "tag";
  }
}
