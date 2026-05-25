import type { Metadata } from "next";
import Link from "next/link";
import { DogPhotoGallery } from "@/components/DogPhotoGallery";
import { MatchBadge } from "@/components/MatchBadge";
import { PerroContactLinks } from "@/components/PerroContactLinks";
import styles from "./perro-detalle.module.css";

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const res = await fetch(`${API_BASE}/api/dogs/${id}`, { cache: "no-store" });
  if (!res.ok) return { title: "Perro — FriendInMe" };
  const dog = (await res.json()) as Record<string, unknown>;
  const name = String(dog.name);
  const desc = String(dog.story || dog.ai_generated_summary || "").slice(0, 160);
  const img = dog.main_image_url ? String(dog.main_image_url) : undefined;
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://friendinme.pmediaplus.com";
  const imageUrl = img?.startsWith("http") ? img : img ? `${base}${img}` : undefined;
  return {
    title: `${name} en adopción — FriendInMe`,
    description: desc || `${name} busca familia en ${dog.city}, ${dog.province}.`,
    openGraph: {
      title: `${name} en adopción`,
      description: desc || undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  };
}

function buildGallery(dog: Record<string, unknown>): string[] {
  const imgs = Array.isArray(dog.images) ? (dog.images as string[]).filter(Boolean) : [];
  const main = dog.main_image_url ? String(dog.main_image_url) : null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of main ? [main, ...imgs] : imgs) {
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  return out;
}

export default async function PerroDetallePage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetch(`${API_BASE}/api/dogs/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p>Perro no encontrado</p>
        <Link href="/perros">Volver</Link>
      </div>
    );
  }
  const dog = (await res.json()) as Record<string, unknown>;
  const name = String(dog.name);
  const gallery = buildGallery(dog);

  return (
    <div className={`container ${styles.page}`}>
      <Link href="/perros" style={{ color: "var(--muted)" }}>
        ← Perros
      </Link>
      <div className={`card ${styles.detailCard}`}>
        <div className={styles.detailGallery}>
          <DogPhotoGallery urls={gallery} name={name} layout="side" />
        </div>
        <div className={styles.detailBody}>
          <h1 style={{ marginTop: 0 }}>{name}</h1>
          <MatchBadge dogId={Number(id)} />
          <p style={{ color: "var(--muted)" }}>
            {String(dog.city)}, {String(dog.province)} · Edad aprox.: {String(dog.age_estimate)} · Tamaño:{" "}
            {String(dog.size)} · Energía: {String(dog.energy_level)}
          </p>
          <h3>Historia</h3>
          <p>{String(dog.story || "—")}</p>
          <h3>Carácter y comportamiento</h3>
          <p>{String(dog.behaviour_notes || "—")}</p>
          <h3>Hogar ideal</h3>
          <p>{String(dog.ideal_home || "—")}</p>
          <h3>Necesidades especiales</h3>
          <p>{String(dog.medical_needs || "—")}</p>
          {dog.ai_generated_summary ? (
            <>
              <h3>Resumen</h3>
              <p>{String(dog.ai_generated_summary)}</p>
            </>
          ) : null}
          <PerroContactLinks
            dogId={id}
            dogName={name}
            shelterWhatsapp={String(dog.shelter_whatsapp || "")}
            shelterName={String(dog.shelter_name || "")}
          />
        </div>
      </div>
    </div>
  );
}
