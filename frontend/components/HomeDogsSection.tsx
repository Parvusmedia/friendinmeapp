import Link from "next/link";
import { DogPhotoThumb } from "@/components/DogPhoto";
import styles from "@/app/page.module.css";

const API_BASE = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type Dog = {
  id: number;
  name: string;
  breed: string;
  province: string;
  city: string;
  size: string;
  energy_level: string;
  main_image_url: string | null;
};

async function loadDogs(): Promise<Dog[]> {
  try {
    const res = await fetch(`${API_BASE}/api/dogs`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    return (await res.json()) as Dog[];
  } catch {
    return [];
  }
}

export async function HomeDogsSection() {
  const dogs = await loadDogs();

  return (
    <section className={styles.dogsSection} aria-labelledby="home-dogs-heading">
      <div className={styles.dogsInner}>
        <div className={styles.dogsHeader}>
          <h2 id="home-dogs-heading" className={styles.dogsTitle}>
            Perros en adopción
          </h2>
          <p className={styles.dogsLead}>
            Explora las fichas disponibles. Para un match orientativo con tu perfil, usa el cuestionario.
          </p>
        </div>

        {dogs.length === 0 ? (
          <p className={styles.dogsEmpty}>
            Ahora mismo no hay perros publicados. Vuelve pronto o{" "}
            <Link href="/cuestionario">completa el cuestionario</Link> para cuando haya nuevas fichas.
          </p>
        ) : (
          <div className={`grid-dogs ${styles.dogsGrid}`}>
            {dogs.map((d) => (
              <article key={d.id} className="card" style={{ overflow: "hidden" }}>
                <DogPhotoThumb src={d.main_image_url} alt={`Foto de ${d.name}`} href={`/perros/${d.id}`} />
                <div style={{ padding: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.15rem" }}>{d.name}</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                    {d.city}, {d.province}
                    {d.breed ? ` · ${d.breed}` : ""} · {d.size} · {d.energy_level}
                  </p>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Link
                      href={`/perros/${d.id}`}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}
                    >
                      Ver ficha
                    </Link>
                    <Link
                      href={`/cuestionario?dog=${d.id}`}
                      className="btn btn-primary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}
                    >
                      Match
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {dogs.length > 0 ? (
          <p className={styles.dogsFooter}>
            <Link href="/perros">Buscar con filtros (provincia, raza, tamaño…)</Link>
          </p>
        ) : null}
      </div>
    </section>
  );
}
