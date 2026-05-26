import Link from "next/link";
import { PublicDogsListing } from "@/components/PublicDogsListing";

export default function PerrosPage() {
  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <h1 style={{ marginTop: 0 }}>Perros en adopción</h1>
      <p style={{ color: "var(--muted)" }}>
        Mismos filtros que en la página principal.{" "}
        <Link href="/#perros">Volver al inicio</Link>
      </p>
      <PublicDogsListing />
    </div>
  );
}
