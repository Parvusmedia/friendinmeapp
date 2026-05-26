"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CompatRing } from "@/components/CompatRing";
import { DogPhotoThumb } from "@/components/DogPhoto";
import { apiFetch } from "@/lib/api";
import { getStoredAdopterId } from "@/lib/adopter-session";
import { AGE_FILTER_OPTIONS, formatAgeForCard } from "@/lib/dog-filters";
import {
  buildListingFiltersFromListingState,
  cuestionarioHref,
  readListingFilters,
  saveListingFilters,
} from "@/lib/match-filters";
import homeCardStyles from "./home-dog-card.module.css";

export type PublicDog = {
  id: number;
  name: string;
  breed: string;
  age_estimate: string;
  province: string;
  city: string;
  size: string;
  energy_level: string;
  main_image_url: string | null;
};

type FiltersMeta = {
  provinces: string[];
  breeds: string[];
};

const SIZE_ES: Record<string, string> = { small: "Pequeño", medium: "Mediano", large: "Grande" };
const ENERGY_ES: Record<string, string> = { low: "Tranquila", medium: "Media", high: "Alta" };

type Props = {
  compact?: boolean;
  variant?: "default" | "home";
};

export function PublicDogsListing({ compact = false, variant = "default" }: Props) {
  const isHome = variant === "home";
  const [dogs, setDogs] = useState<PublicDog[]>([]);
  const [meta, setMeta] = useState<FiltersMeta>({ provinces: [], breeds: [] });
  const [province, setProvince] = useState("");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState("");
  const [energy, setEnergy] = useState("");
  const [age, setAge] = useState("");
  const [minCompat, setMinCompat] = useState("");
  const [scores, setScores] = useState<Record<number, number>>({});
  const [hasAdopter, setHasAdopter] = useState(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const canFilterByCompat = hasAdopter && scoresLoaded && Object.keys(scores).length > 0;

  useEffect(() => {
    apiFetch("/api/dogs/filters")
      .then((d) => setMeta(d as FiltersMeta))
      .catch(() => setMeta({ provinces: [], breeds: [] }));
  }, []);

  useEffect(() => {
    const stored = readListingFilters();
    if (!stored) return;
    if (stored.province) setProvince(stored.province);
    if (stored.breed) setBreed(stored.breed);
    if (stored.size) setSize(stored.size);
    if (stored.energy_level) setEnergy(stored.energy_level);
    if (stored.age) setAge(stored.age);
  }, []);

  useEffect(() => {
    const adopterId = getStoredAdopterId();
    if (!adopterId) {
      setHasAdopter(false);
      setScores({});
      setScoresLoaded(true);
      return;
    }
    setHasAdopter(true);
    setScoresLoaded(false);
    apiFetch(`/api/matches/${adopterId}`)
      .then((stored) => {
        const map: Record<number, number> = {};
        for (const r of stored as { dog_id: number; compatibility_score: number }[]) {
          map[r.dog_id] = Math.round(r.compatibility_score);
        }
        setScores(map);
      })
      .catch(() => setScores({}))
      .finally(() => setScoresLoaded(true));
  }, []);

  useEffect(() => {
    if (!canFilterByCompat) setMinCompat("");
  }, [canFilterByCompat]);

  const load = useCallback(() => {
    setErr(null);
    setLoading(true);
    const q = new URLSearchParams();
    if (province) q.set("province", province);
    if (breed) q.set("breed", breed);
    if (size) q.set("size", size);
    if (energy) q.set("energy_level", energy);
    if (age) q.set("age", age);
    const qs = q.toString();
    apiFetch(`/api/dogs${qs ? `?${qs}` : ""}`)
      .then((d) => setDogs(d as PublicDog[]))
      .catch((e) => setErr(String(e.message)))
      .finally(() => setLoading(false));
  }, [province, breed, size, energy, age]);

  useEffect(() => {
    load();
  }, [load]);

  const listingFilters = useMemo(
    () => buildListingFiltersFromListingState(province, breed, size, energy, age),
    [province, breed, size, energy, age]
  );

  const matchHref = useMemo(() => {
    saveListingFilters(listingFilters);
    return cuestionarioHref(listingFilters);
  }, [listingFilters]);

  const visibleDogs = useMemo(() => {
    if (!minCompat || !canFilterByCompat) return dogs;
    const min = Number(minCompat);
    return dogs.filter((d) => (scores[d.id] ?? 0) >= min);
  }, [dogs, minCompat, canFilterByCompat, scores]);

  const activeCompatFilter = Boolean(minCompat && canFilterByCompat);

  const scrollToGrid = () => {
    document.getElementById("perros-grid")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {!compact && !isHome ? (
        <p className="dogs-filter-hint">
          Filtra por lo básico; el match fino lo hacemos en el cuestionario. La raza es orientativa.
        </p>
      ) : null}

      <div className={`card dogs-filters-bar${compact ? " dogs-filters-bar--compact" : ""}${isHome ? " dogs-filters-bar--home" : ""}`}>
        <div className="field dogs-filter-field">
          <label>Provincia</label>
          <select value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Provincia">
            <option value="">{isHome ? "Todas" : "Todas (con perros)"}</option>
            {meta.provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="field dogs-filter-field">
          <label>Tamaño</label>
          <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Tamaño">
            <option value="">{isHome ? "Cualquiera" : "—"}</option>
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>
        </div>
        <div className="field dogs-filter-field">
          <label>Energía</label>
          <select value={energy} onChange={(e) => setEnergy(e.target.value)} aria-label="Energía">
            <option value="">{isHome ? "Cualquiera" : "—"}</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div className="field dogs-filter-field">
          <label>Edad</label>
          <select value={age} onChange={(e) => setAge(e.target.value)} aria-label="Edad">
            <option value="">{isHome ? "Cualquiera" : "—"}</option>
            {AGE_FILTER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field dogs-filter-field">
          <label>Raza {isHome ? "" : "(orientativa)"}</label>
          <select value={breed} onChange={(e) => setBreed(e.target.value)} aria-label="Raza">
            <option value="">{isHome ? "Cualquiera" : "Cualquiera"}</option>
            {meta.breeds.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        {isHome && canFilterByCompat ? (
          <div className="field dogs-filter-field dogs-filter-field--compat">
            <label>Compatibilidad mínima</label>
            <select
              value={minCompat}
              onChange={(e) => setMinCompat(e.target.value)}
              aria-label="Compatibilidad mínima"
            >
              <option value="">Cualquiera</option>
              <option value="60">60% o más</option>
              <option value="70">70% o más</option>
              <option value="80">80% o más</option>
            </select>
          </div>
        ) : null}
        {isHome ? (
          <button type="button" className="btn btn-primary dogs-filters-search" onClick={scrollToGrid}>
            <span aria-hidden>🔍</span> Ver perros compatibles
          </button>
        ) : (
          <Link href={matchHref} className="btn btn-secondary dogs-filters-cta">
            Comprobar compatibilidad
          </Link>
        )}
      </div>

      {isHome && !canFilterByCompat ? (
        <p className="dogs-filter-hint">
          <Link href="/cuestionario">Completa el cuestionario</Link> para ver el % de compatibilidad en cada ficha y
          filtrar por compatibilidad mínima.
        </p>
      ) : null}

      {err ? <p className="notice">{err}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", margin: "1rem 0" }}>Cargando perros…</p> : null}
      {!loading && !err && visibleDogs.length === 0 ? (
        <p className="notice" style={{ marginTop: "1rem" }}>
          {activeCompatFilter ? (
            <>
              Ningún perro alcanza ese % de compatibilidad con tu perfil. Prueba un umbral más bajo o{" "}
              <Link href="/resultados">revisa tus matches</Link>.
            </>
          ) : (
            <>
              Ningún perro coincide con estos filtros. Amplía provincia, tamaño, energía, edad o raza, o{" "}
              <Link href="/cuestionario">haz el cuestionario</Link> para un match más fino.
            </>
          )}
        </p>
      ) : null}

      {!loading && visibleDogs.length > 0 ? (
        <div
          id="perros-grid"
          className={`grid-dogs dogs-listing-grid${isHome ? " grid-dogs--home" : ""}`}
        >
          {visibleDogs.map((d) => {
            const ageLabel = formatAgeForCard(d.age_estimate);
            return isHome ? (
              <article key={d.id} className={`card ${homeCardStyles.card}`}>
                <DogPhotoThumb src={d.main_image_url} alt={`Foto de ${d.name}`} href={`/perros/${d.id}`} height={180} />
                <div className={homeCardStyles.body}>
                  <div className={homeCardStyles.head}>
                    <h3 className={homeCardStyles.name}>{d.name}</h3>
                    {scores[d.id] != null ? <CompatRing pct={scores[d.id]} size="sm" /> : null}
                  </div>
                  <p className={homeCardStyles.loc}>
                    <span aria-hidden>📍</span> {d.city}, {d.province}
                  </p>
                  <div className={homeCardStyles.tags} aria-label="Características">
                    {ageLabel ? (
                      <span className={`${homeCardStyles.tag} ${homeCardStyles.tagAge}`}>{ageLabel}</span>
                    ) : null}
                    {d.breed ? <span className={homeCardStyles.tag}>{d.breed}</span> : null}
                    <span className={homeCardStyles.tag}>{SIZE_ES[d.size] ?? d.size}</span>
                    <span className={homeCardStyles.tag}>{ENERGY_ES[d.energy_level] ?? d.energy_level}</span>
                  </div>
                  <div className={homeCardStyles.actions}>
                    <Link href={`/perros/${d.id}`} className={`btn btn-secondary ${homeCardStyles.btn}`}>
                      Ver ficha
                    </Link>
                    <Link href={`/cuestionario?dog=${d.id}`} className={`btn btn-primary ${homeCardStyles.btn}`}>
                      Match <span aria-hidden>♥</span>
                    </Link>
                  </div>
                </div>
              </article>
            ) : (
              <article key={d.id} className="card" style={{ overflow: "hidden" }}>
                <DogPhotoThumb src={d.main_image_url} alt={`Foto de ${d.name}`} href={`/perros/${d.id}`} />
                <div style={{ padding: "1rem" }}>
                  <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.15rem" }}>{d.name}</h3>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.45 }}>
                    {d.city}, {d.province}
                    {ageLabel ? ` · ${ageLabel}` : ""}
                    {d.breed ? ` · ${d.breed}` : ""} · {SIZE_ES[d.size] ?? d.size} ·{" "}
                    {ENERGY_ES[d.energy_level] ?? d.energy_level}
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
            );
          })}
        </div>
      ) : null}

      {isHome ? (
        <p style={{ marginTop: "1.25rem", textAlign: "center" }}>
          <Link href={matchHref} className="btn btn-secondary">
            Comprobar compatibilidad con el cuestionario
          </Link>
        </p>
      ) : null}
    </>
  );
}
