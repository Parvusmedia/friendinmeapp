"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DogPhotoThumb } from "@/components/DogPhoto";
import { apiFetch } from "@/lib/api";
import { getStoredAdopterId } from "@/lib/adopter-session";
import { CompatRing } from "@/components/CompatRing";
import type { PublicDog } from "@/components/PublicDogsListing";
import styles from "@/app/page.module.css";

const SIZE_ES: Record<string, string> = { small: "Pequeña", medium: "Mediana", large: "Grande" };
const ENERGY_ES: Record<string, string> = { low: "Tranquila", medium: "Equilibrada", high: "Activa" };

export function HomeHero() {
  const [featured, setFeatured] = useState<PublicDog | null>(null);
  const [featuredScore, setFeaturedScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dogs = (await apiFetch("/api/dogs")) as PublicDog[];
        if (cancelled || !dogs.length) return;
        const lola = dogs.find((d) => d.name.toLowerCase() === "lola" && d.main_image_url);
        const pick = lola ?? dogs.find((d) => d.main_image_url) ?? dogs[0];
        setFeatured(pick);

        const adopterId = getStoredAdopterId();
        if (adopterId) {
          const stored = (await apiFetch(`/api/matches/${adopterId}`)) as {
            dog_id: number;
            compatibility_score: number;
          }[];
          const row = stored.find((r) => r.dog_id === pick.id);
          if (row) setFeaturedScore(Math.round(row.compatibility_score));
        }
      } catch {
        /* sin perros destacados */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={styles.hero} aria-label="Presentación">
      <div className={styles.heroGrid}>
        <div className={styles.heroCopy}>
          <p className={styles.badge}>
            <span aria-hidden>🐾</span> Adopción responsable
          </p>
          <h1 className={styles.title}>
            No busques solo un perro bonito.{" "}
            <span className={styles.accent}>Encuentra el compañero que encaja contigo.</span>
          </h1>
          <p className={styles.lead}>
            FriendInMe cruza tu estilo de vida con la ficha real de cada perro. Sin promesas mágicas: información clara,
            compatibilidad orientativa y refugios de confianza.
          </p>
          <div className={styles.actions}>
            <Link href="/cuestionario" className={styles.btnPrimary}>
              <span aria-hidden>♥</span> Encontrar mi match
            </Link>
            <Link href="/refugio/solicitud" className={styles.btnSecondary}>
              <span aria-hidden>🏠</span> Soy un refugio
            </Link>
          </div>
          <ul className={styles.trustList}>
            <li>
              <span aria-hidden>✓</span> Basado en compatibilidad
            </li>
            <li>
              <span aria-hidden>♥</span> Perros de refugios
            </li>
            <li>
              <span aria-hidden>🐾</span> Adopción responsable
            </li>
          </ul>
        </div>

        {featured ? (
          <article className={styles.featuredCard}>
            <span className={styles.featuredBadge}>
              <span aria-hidden>★</span> Recomendado para ti
            </span>
            <DogPhotoThumb
              src={featured.main_image_url}
              alt={`Foto de ${featured.name}`}
              href={`/perros/${featured.id}`}
              height={220}
            />
            <div className={styles.featuredBody}>
              <div className={styles.featuredHead}>
                <div>
                  <h2 className={styles.featuredName}>{featured.name}</h2>
                  <p className={styles.featuredLoc}>
                    <span aria-hidden>📍</span> {featured.city}, {featured.province}
                  </p>
                </div>
                {featuredScore != null ? (
                  <CompatRing pct={featuredScore} />
                ) : (
                  <Link href="/cuestionario" className={styles.featuredScoreCta}>
                    Ver compatibilidad
                  </Link>
                )}
              </div>
              <div className={styles.tagRow}>
                {featured.breed ? <span className={styles.tag}>{featured.breed}</span> : null}
                <span className={styles.tag}>{SIZE_ES[featured.size] ?? featured.size}</span>
                <span className={styles.tag}>{ENERGY_ES[featured.energy_level] ?? featured.energy_level}</span>
              </div>
              <div className={styles.featuredActions}>
                <Link href={`/perros/${featured.id}`} className={styles.featuredLink}>
                  Ver ficha
                </Link>
                <Link href={`/cuestionario?dog=${featured.id}`} className={styles.featuredMatchBtn}>
                  ¡Es mi match! <span aria-hidden>♥</span>
                </Link>
              </div>
            </div>
          </article>
        ) : (
          <div className={styles.featuredPlaceholder} aria-hidden />
        )}
      </div>
    </section>
  );
}
