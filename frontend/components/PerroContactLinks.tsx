"use client";

import Link from "next/link";
import { whatsappUrl } from "@/lib/whatsapp";

type Props = {
  dogId: string;
  dogName: string;
  shelterWhatsapp: string;
  shelterName: string;
};

export function PerroContactLinks({ dogId, dogName, shelterWhatsapp, shelterName }: Props) {
  const wa = shelterWhatsapp
    ? whatsappUrl(
        shelterWhatsapp,
        `Hola, me interesa adoptar a ${dogName} que vi en FriendInMe. ¿Podemos hablar?`
      )
    : null;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.5rem" }}>
      <Link href={`/cuestionario?dog=${dogId}`} className="btn btn-primary">
        Quiero saber si encaja conmigo
      </Link>
      <Link href={`/contacto?dog=${dogId}`} className="btn btn-secondary">
        Contactar por este perro
      </Link>
      {wa ? (
        <a href={wa} className="btn btn-secondary" target="_blank" rel="noopener noreferrer">
          WhatsApp{shelterName ? ` (${shelterName})` : ""}
        </a>
      ) : null}
    </div>
  );
}
