"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CompatRing } from "@/components/CompatRing";
import { PartnerPlacement } from "@/components/PartnerPlacement";
import { DOG_PHOTO_OBJECT_POSITION } from "@/components/DogPhoto";
import { apiFetch } from "@/lib/api";
import { getStoredAdopterId } from "@/lib/adopter-session";
import {
  buildKnowTags,
  buildProfileTags,
  energyLabelEs,
  formatAgeForCard,
  parseBulletLines,
  sizeLabelEs,
} from "@/lib/dog-display";
import { resolveMediaUrl } from "@/lib/media-url";
import { whatsappUrl } from "@/lib/whatsapp";
import homeCardStyles from "@/components/home-dog-card.module.css";
import styles from "./perro-detalle.module.css";

export type DogDetail = {
  id: number;
  name: string;
  breed: string;
  age_estimate: string;
  size: string;
  energy_level: string;
  province: string;
  city: string;
  story: string;
  behaviour_notes: string;
  ideal_home: string;
  medical_needs: string;
  ai_generated_summary?: string | null;
  status: string;
  main_image_url: string | null;
  images: string[];
  shelter_name: string;
  shelter_whatsapp: string;
  can_live_in_apartment?: string;
};

export type SimilarDog = {
  id: number;
  name: string;
  breed: string;
  age_estimate: string;
  city: string;
  province: string;
  size: string;
  energy_level: string;
  main_image_url: string | null;
};

type Props = {
  dog: DogDetail;
  gallery: string[];
  similar: SimilarDog[];
};

const ENERGY_TAG: Record<string, string> = { low: "Tranquila", medium: "Equilibrada", high: "Activa" };

export function PerroDetalleView({ dog, gallery, similar }: Props) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [fav, setFav] = useState(false);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const list = gallery.filter(Boolean);
  const current = list[photoIndex] ?? null;
  const currentSrc = current ? resolveMediaUrl(current) : null;
  const visibleThumbs = 4;
  const extraCount = Math.max(0, list.length - visibleThumbs);

  const idealBullets = parseBulletLines(dog.ideal_home);
  const profileTags = buildProfileTags(dog);
  const knowTags = buildKnowTags(dog);
  const ageLabel = formatAgeForCard(dog.age_estimate);

  useEffect(() => {
    const adopterId = getStoredAdopterId();
    if (!adopterId) return;
    apiFetch(`/api/matches/preview?adopter_profile_id=${adopterId}&dog_id=${dog.id}`)
      .then((r) => setMatchScore(Math.round((r as { compatibility_score: number }).compatibility_score)))
      .catch(() => setMatchScore(null));
  }, [dog.id]);

  const wa = dog.shelter_whatsapp
    ? whatsappUrl(
        dog.shelter_whatsapp,
        `Hola, me interesa adoptar a ${dog.name} que vi en FriendInMe. ¿Podemos hablar?`
      )
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Link href="/perros" className={styles.back}>
          ← Volver a perros
        </Link>

        <section className={styles.hero} aria-label={`Ficha de ${dog.name}`}>
          <div className={styles.heroMedia}>
            <div className={styles.mainPhoto}>
              {currentSrc ? (
                <Image
                  src={currentSrc}
                  alt={dog.name}
                  fill
                  className={styles.mainPhotoImg}
                  style={{ objectPosition: DOG_PHOTO_OBJECT_POSITION }}
                  sizes="(max-width: 900px) 100vw, 55vw"
                  priority
                  unoptimized
                />
              ) : (
                <div className={styles.photoEmpty} />
              )}
              <button
                type="button"
                className={`${styles.favBtn} ${fav ? styles.favBtnOn : ""}`}
                aria-label={fav ? "Quitar de favoritos" : "Guardar en favoritos"}
                onClick={() => setFav((v) => !v)}
              >
                {fav ? "♥" : "♡"}
              </button>
            </div>
            {list.length > 1 ? (
              <div className={styles.thumbs} role="tablist" aria-label="Fotos">
                {list.slice(0, visibleThumbs).map((url, i) => {
                  const isMore = i === visibleThumbs - 1 && extraCount > 0;
                  return (
                    <button
                      key={url}
                      type="button"
                      role="tab"
                      aria-selected={i === photoIndex}
                      className={`${styles.thumb} ${i === photoIndex ? styles.thumbActive : ""}`}
                      onClick={() => setPhotoIndex(isMore ? visibleThumbs : i)}
                    >
                      <Image
                        src={resolveMediaUrl(url)}
                        alt=""
                        fill
                        className={styles.thumbImg}
                        style={{ objectPosition: DOG_PHOTO_OBJECT_POSITION }}
                        sizes="80px"
                        unoptimized
                      />
                      {isMore ? <span className={styles.thumbMore}>+{extraCount}</span> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className={styles.summaryCard}>
            <div className={styles.summaryHead}>
              <div>
                <h1 className={styles.name}>{dog.name}</h1>
                <ul className={styles.metaRow}>
                  <li>
                    <span aria-hidden>📍</span> {dog.city}, {dog.province}
                  </li>
                  {ageLabel ? (
                    <li>
                      <span aria-hidden>🎂</span> {ageLabel}
                    </li>
                  ) : null}
                  <li>
                    <span aria-hidden>📏</span> {sizeLabelEs(dog.size)}
                  </li>
                  <li>
                    <span aria-hidden>⚡</span> Energía {energyLabelEs(dog.energy_level).toLowerCase()}
                  </li>
                  {dog.breed ? (
                    <li>
                      <span aria-hidden>🐾</span> {dog.breed}
                    </li>
                  ) : null}
                </ul>
              </div>
              {matchScore != null ? <CompatRing pct={matchScore} /> : null}
            </div>

            {profileTags.length ? (
              <div className={styles.tagRow}>
                {profileTags.map((t) => (
                  <span key={t} className={styles.tag}>
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            {idealBullets.length ? (
              <div className={styles.idealBox}>
                <p className={styles.idealTitle}>Ideal para</p>
                <ul className={styles.idealList}>
                  {idealBullets.map((item) => (
                    <li key={item}>
                      <span aria-hidden>✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className={styles.ctaStack}>
              <Link href={`/cuestionario?dog=${dog.id}`} className={`btn btn-primary ${styles.ctaPrimary}`}>
                <span aria-hidden>♥</span> Quiero saber si encaja conmigo
              </Link>
              {wa ? (
                <a href={wa} className={`btn btn-secondary ${styles.ctaSecondary}`} target="_blank" rel="noopener noreferrer">
                  <span aria-hidden>💬</span> Contactar por este perro
                </a>
              ) : (
                <Link href={`/contacto?dog=${dog.id}`} className={`btn btn-secondary ${styles.ctaSecondary}`}>
                  <span aria-hidden>💬</span> Contactar por este perro
                </Link>
              )}
            </div>
          </aside>
        </section>

        <section className={styles.infoGrid} aria-label="Información detallada">
          <article className={styles.infoBlock}>
            <div className={styles.infoIcon} aria-hidden>
              📖
            </div>
            <h2 className={styles.infoTitle}>Historia</h2>
            <p className={styles.infoText}>{dog.story?.trim() || "El refugio aún no ha añadido la historia de este perro."}</p>
          </article>
          <article className={styles.infoBlock}>
            <div className={styles.infoIcon} aria-hidden>
              🐾
            </div>
            <h2 className={styles.infoTitle}>Carácter y comportamiento</h2>
            <p className={styles.infoText}>{dog.behaviour_notes?.trim() || "—"}</p>
          </article>
          <article className={styles.infoBlock}>
            <div className={styles.infoIcon} aria-hidden>
              🏠
            </div>
            <h2 className={styles.infoTitle}>Hogar ideal</h2>
            <p className={styles.infoText}>{dog.ideal_home?.trim() || "—"}</p>
          </article>
          <article className={styles.infoBlock}>
            <div className={styles.infoIcon} aria-hidden>
              🩺
            </div>
            <h2 className={styles.infoTitle}>Necesidades especiales</h2>
            <p className={styles.infoText}>{dog.medical_needs?.trim() || "Sin necesidades especiales registradas."}</p>
          </article>
        </section>

        <section className={styles.knowBand} aria-labelledby="know-heading">
          <h2 id="know-heading" className={styles.knowTitle}>
            Lo que debes saber sobre {dog.name}
          </h2>
          <div className={styles.knowGrid}>
            {knowTags.map((t) => (
              <div key={t.label} className={styles.knowItem}>
                <span className={styles.knowIcon} aria-hidden>
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        <PartnerPlacement
          placement="dog_detail_footer"
          context={{
            dogId: dog.id,
            dogName: dog.name,
            breed: dog.breed,
            size: dog.size,
            energy_level: dog.energy_level,
            age_estimate: dog.age_estimate,
          }}
        />

        {similar.length > 0 ? (
          <section className={styles.similar} aria-labelledby="similar-heading">
            <h2 id="similar-heading" className={styles.similarTitle}>
              Perros similares
            </h2>
            <div className={styles.similarGrid}>
              {similar.map((s) => {
                const sAge = formatAgeForCard(s.age_estimate);
                return (
                  <article key={s.id} className={`card ${homeCardStyles.card}`}>
                    <Link href={`/perros/${s.id}`} className={styles.similarPhotoLink}>
                      <div className={styles.similarPhoto}>
                        {s.main_image_url ? (
                          <Image
                            src={resolveMediaUrl(s.main_image_url)}
                            alt=""
                            fill
                            className={styles.similarPhotoImg}
                            style={{ objectPosition: DOG_PHOTO_OBJECT_POSITION }}
                            sizes="280px"
                            unoptimized
                          />
                        ) : null}
                      </div>
                    </Link>
                    <div className={homeCardStyles.body}>
                      <h3 className={homeCardStyles.name}>{s.name}</h3>
                      <p className={homeCardStyles.loc}>
                        <span aria-hidden>📍</span> {s.city}, {s.province}
                      </p>
                      <div className={homeCardStyles.tags}>
                        {sAge ? <span className={`${homeCardStyles.tag} ${homeCardStyles.tagAge}`}>{sAge}</span> : null}
                        {s.breed ? <span className={homeCardStyles.tag}>{s.breed}</span> : null}
                        <span className={homeCardStyles.tag}>{sizeLabelEs(s.size)}</span>
                        <span className={homeCardStyles.tag}>{ENERGY_TAG[s.energy_level] ?? s.energy_level}</span>
                      </div>
                      <div className={homeCardStyles.actions}>
                        <Link href={`/perros/${s.id}`} className={`btn btn-secondary ${homeCardStyles.btn}`}>
                          Ver ficha
                        </Link>
                        <Link href={`/cuestionario?dog=${s.id}`} className={`btn btn-primary ${homeCardStyles.btn}`}>
                          ¡Es mi match! <span aria-hidden>♥</span>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        <footer className={styles.trustFooter}>
          <p className={styles.trustLead}>
            <span aria-hidden>🛡️</span> Adopción responsable · Datos validados por refugios
          </p>
          <p className={styles.trustText}>
            FriendInMe conecta adoptantes y refugios con información clara. La decisión final siempre es del refugio y de
            tu familia.
          </p>
        </footer>
      </div>
    </div>
  );
}
