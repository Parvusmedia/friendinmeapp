import type { Metadata } from "next";
import Link from "next/link";
import { PerroDetalleView, type DogDetail, type SimilarDog } from "./PerroDetalleView";
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

function toDogDetail(raw: Record<string, unknown>): DogDetail {
  return {
    id: Number(raw.id),
    name: String(raw.name),
    breed: String(raw.breed || ""),
    age_estimate: String(raw.age_estimate || ""),
    size: String(raw.size),
    energy_level: String(raw.energy_level),
    province: String(raw.province),
    city: String(raw.city),
    story: String(raw.story || ""),
    behaviour_notes: String(raw.behaviour_notes || ""),
    ideal_home: String(raw.ideal_home || ""),
    medical_needs: String(raw.medical_needs || ""),
    ai_generated_summary: raw.ai_generated_summary ? String(raw.ai_generated_summary) : null,
    status: String(raw.status || "available"),
    main_image_url: raw.main_image_url ? String(raw.main_image_url) : null,
    images: Array.isArray(raw.images) ? (raw.images as string[]) : [],
    shelter_name: String(raw.shelter_name || ""),
    shelter_whatsapp: String(raw.shelter_whatsapp || ""),
    can_live_in_apartment: raw.can_live_in_apartment ? String(raw.can_live_in_apartment) : undefined,
  };
}

function toSimilarDog(raw: Record<string, unknown>): SimilarDog {
  return {
    id: Number(raw.id),
    name: String(raw.name),
    breed: String(raw.breed || ""),
    age_estimate: String(raw.age_estimate || ""),
    city: String(raw.city),
    province: String(raw.province),
    size: String(raw.size),
    energy_level: String(raw.energy_level),
    main_image_url: raw.main_image_url ? String(raw.main_image_url) : null,
  };
}

async function loadSimilar(currentId: number, size: string): Promise<SimilarDog[]> {
  try {
    const res = await fetch(`${API_BASE}/api/dogs`, { cache: "no-store" });
    if (!res.ok) return [];
    const all = (await res.json()) as Record<string, unknown>[];
    return all
      .filter((d) => Number(d.id) !== currentId && String(d.size) === size)
      .slice(0, 3)
      .map(toSimilarDog);
  } catch {
    return [];
  }
}

export default async function PerroDetallePage({ params }: PageProps) {
  const { id } = await params;
  const res = await fetch(`${API_BASE}/api/dogs/${id}`, { cache: "no-store" });
  if (!res.ok) {
    return (
      <div className={styles.shell} style={{ padding: "2rem 1rem" }}>
        <p>Perro no encontrado</p>
        <Link href="/perros">Volver a perros</Link>
      </div>
    );
  }
  const raw = (await res.json()) as Record<string, unknown>;
  const dog = toDogDetail(raw);
  const gallery = buildGallery(raw);
  const similar = await loadSimilar(dog.id, dog.size);

  return <PerroDetalleView dog={dog} gallery={gallery} similar={similar} />;
}
