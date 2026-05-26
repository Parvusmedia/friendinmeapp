"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DogPhotoThumb } from "@/components/DogPhoto";
import { apiFetch } from "@/lib/api";
import {
  buildListingFiltersFromListingState,
  cuestionarioHref,
  saveListingFilters,
} from "@/lib/match-filters";

export type PublicDog = {
  id: number;
  name: string;
  breed: string;
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

type Props = {
  /** Menos texto introductorio (Home2) */
  compact?: boolean;
};

export function PublicDogsListing({ compact = false }: Props) {
  const [dogs, setDogs] = useState<PublicDog[]>([]);
  const [meta, setMeta] = useState<FiltersMeta>({ provinces: [], breeds: [] });
  const [province, setProvince] = useState("");
  const [breed, setBreed] = useState("");
  const [size, setSize] = useState("");
  const [energy, setEnergy] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/dogs/filters")
      .then((d) => setMeta(d as FiltersMeta))
      .catch(() => setMeta({ provinces: [], breeds: [] }));
  }, []);

  const load = useCallback(() => {
    setErr(null);
    setLoading(true);
    const q = new URLSearchParams();
    if (province) q.set("province", province);
    if (breed) q.set("breed", breed);
    if (size) q.set("size", size);
    if (energy) q.set("energy_level", energy);
    const qs = q.toString();
    apiFetch(`/api/dogs${qs ? `?${qs}` : ""}`)
      .then((d) => setDogs(d as PublicDog[]))
      .catch((e) => setErr(String(e.message)))
      .finally(() => setLoading(false));
  }, [province, breed, size, energy]);

  useEffect(() => {
    load();
  }, [load]);

  const listingFilters = useMemo(
    () => buildListingFiltersFromListingState(province, breed, size, energy),
    [province, breed, size, energy]
  );

  const matchHref = useMemo(() => {
    saveListingFilters(listingFilters);
    return cuestionarioHref(listingFilters);
  }, [listingFilters]);

  return (
    <>
      {!compact ? (
        <p className="dogs-filter-hint">
          Filtra por lo básico; el match fino lo hacemos en el cuestionario. La raza es orientativa.
        </p>
      ) : null}

      <div className={`card dogs-filters-bar${compact ? " dogs-filters-bar--compact" : ""}`}>
        <div className="field" style={{ margin: 0, minWidth: 140, flex: "1 1 140px" }}>
          <label>Provincia</label>
          <select value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Provincia">
            <option value="">Todas (con perros)</option>
            {meta.provinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 140, flex: "1 1 140px" }}>
          <label>Raza (orientativa)</label>
          <select value={breed} onChange={(e) => setBreed(e.target.value)} aria-label="Raza">
            <option value="">Cualquiera</option>
            {meta.breeds.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 120, flex: "1 1 120px" }}>
          <label>Tamaño</label>
          <select value={size} onChange={(e) => setSize(e.target.value)} aria-label="Tamaño">
            <option value="">—</option>
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>
        </div>
        <div className="field" style={{ margin: 0, minWidth: 120, flex: "1 1 120px" }}>
          <label>Energía</label>
          <select value={energy} onChange={(e) => setEnergy(e.target.value)} aria-label="Energía">
            <option value="">—</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <Link href={matchHref} className="btn btn-secondary dogs-filters-cta">
          Comprobar compatibilidad
        </Link>
      </div>

      {err ? <p className="notice">{err}</p> : null}
      {loading ? <p style={{ color: "var(--muted)", margin: "1rem 0" }}>Cargando perros…</p> : null}
      {!loading && !err && dogs.length === 0 ? (
        <p className="notice" style={{ marginTop: "1rem" }}>
          Ningún perro coincide con estos filtros. Prueba a ampliar la búsqueda o{" "}
          <Link href="/cuestionario">haz el cuestionario de compatibilidad</Link>.
        </p>
      ) : null}

      {!loading && dogs.length > 0 ? (
        <div className="grid-dogs dogs-listing-grid">
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
      ) : null}
    </>
  );
}
