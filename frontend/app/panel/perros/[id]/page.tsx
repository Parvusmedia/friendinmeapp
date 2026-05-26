"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { BREED_OPTIONS } from "@/lib/breeds";

type Dog = {
  id: number;
  shelter_id: number;
  name: string;
  breed: string;
  age_estimate: string;
  size: string;
  sex: string;
  province: string;
  city: string;
  energy_level: string;
  sociability_with_dogs: string;
  sociability_with_cats: string;
  good_with_children: string;
  can_live_in_apartment: string;
  needs_experience: string;
  can_be_alone_hours: string;
  medical_needs: string;
  behaviour_notes: string;
  story: string;
  ideal_home: string;
  status: string;
  main_image_url: string | null;
  images: string[];
};

function galleryPaths(dog: Dog): string[] {
  const s = new Set<string>();
  if (dog.main_image_url) s.add(String(dog.main_image_url));
  const imgs = dog.images;
  if (Array.isArray(imgs)) {
    for (const p of imgs) {
      if (p) s.add(String(p));
    }
  }
  return Array.from(s);
}

function parseDogId(params: ReturnType<typeof useParams>): number | null {
  const raw = params?.id;
  const idStr = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const n = Number(idStr);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function normalizeDog(raw: Record<string, unknown>): Dog {
  return {
    ...(raw as Dog),
    images: Array.isArray(raw.images) ? raw.images.map(String) : [],
    main_image_url: raw.main_image_url ? String(raw.main_image_url) : null,
  };
}

function PanelPerroEditarInner() {
  const params = useParams();
  const router = useRouter();
  const dogId = parseDogId(params);
  const fileRef = useRef<HTMLInputElement>(null);

  const [dog, setDog] = useState<Dog | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [f, setF] = useState({
    name: "",
    breed: "Mestizo",
    age_estimate: "",
    size: "medium",
    sex: "unknown",
    province: "",
    city: "",
    energy_level: "medium",
    sociability_with_dogs: "unknown",
    sociability_with_cats: "unknown",
    good_with_children: "unknown",
    can_live_in_apartment: "unknown",
    needs_experience: "unknown",
    can_be_alone_hours: "unknown",
    medical_needs: "",
    behaviour_notes: "",
    story: "",
    ideal_home: "",
    status: "available",
  });

  const loadDog = useCallback(async () => {
    if (!dogId) return;
    const d = normalizeDog((await apiFetch(`/api/dogs/${dogId}`)) as Record<string, unknown>);
    setDog(d);
    setF({
      name: d.name,
      breed: d.breed || "Mestizo",
      age_estimate: d.age_estimate,
      size: d.size,
      sex: d.sex,
      province: d.province,
      city: d.city,
      energy_level: d.energy_level,
      sociability_with_dogs: d.sociability_with_dogs,
      sociability_with_cats: d.sociability_with_cats,
      good_with_children: d.good_with_children,
      can_live_in_apartment: d.can_live_in_apartment,
      needs_experience: d.needs_experience,
      can_be_alone_hours: d.can_be_alone_hours,
      medical_needs: d.medical_needs || "",
      behaviour_notes: d.behaviour_notes || "",
      story: d.story || "",
      ideal_home: d.ideal_home || "",
      status: d.status,
    });
  }, [dogId]);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/panel/login");
      return;
    }
    if (!dogId) {
      setErr("ID de perro no válido");
      return;
    }
    loadDog().catch((e) => {
      const msg = e instanceof Error ? e.message : "Error al cargar";
      if (msg.includes("401") || msg.toLowerCase().includes("authenticated")) {
        router.replace("/panel/login");
        return;
      }
      setErr(msg);
    });
  }, [dogId, router, loadDog]);

  const saveData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dogId) return;
    setErr(null);
    setLoading(true);
    try {
      await apiFetch(`/api/dogs/${dogId}`, {
        method: "PUT",
        body: JSON.stringify(f),
      });
      await loadDog();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File, setMain: boolean) => {
    setPhotoBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const q = setMain ? "?set_main=true" : "";
      const updated = normalizeDog(
        (await apiFetch(`/api/dogs/${dogId}/images${q}`, { method: "POST", body: fd })) as Record<string, unknown>
      );
      setDog(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al subir foto");
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async (path: string) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    setPhotoBusy(true);
    setErr(null);
    try {
      const updated = normalizeDog(
        (await apiFetch(`/api/dogs/${dogId}/images`, {
          method: "DELETE",
          body: JSON.stringify({ path }),
        })) as Record<string, unknown>
      );
      setDog(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setPhotoBusy(false);
    }
  };

  const setMainPhoto = async (path: string) => {
    setPhotoBusy(true);
    setErr(null);
    try {
      const updated = normalizeDog(
        (await apiFetch(`/api/dogs/${dogId}/main-image`, {
          method: "POST",
          body: JSON.stringify({ path }),
        })) as Record<string, unknown>
      );
      setDog(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    } finally {
      setPhotoBusy(false);
    }
  };

  if (!dog && !err) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        Cargando…
      </div>
    );
  }

  const photos = dog ? galleryPaths(dog) : [];

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 720 }}>
      <p>
        <Link href="/panel/perros">← Perros</Link>
        {dog?.shelter_id ? (
          <>
            {" · "}
            <Link href={`/panel/refugios/${dog.shelter_id}`}>← Refugio</Link>
          </>
        ) : null}
        {" · "}
        <Link href={`/perros/${dogId}`}>Ver ficha pública</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>{dog ? `Editar: ${dog.name}` : "Editar perro"}</h1>
      {dog ? (
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Refugio #{dog.shelter_id} ·{" "}
          <Link href={`/perros/${dog.id}`} target="_blank" rel="noopener noreferrer">
            Ver ficha pública
          </Link>
        </p>
      ) : null}

      {dog ? (
        <section className="card" style={{ padding: "1.25rem", marginBottom: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Fotos</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 0 }}>
            Sube imágenes (jpg, png, webp). Marca una como portada o elimina las que no uses.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {photos.length === 0 ? (
              <p style={{ color: "var(--muted)", gridColumn: "1 / -1" }}>Sin fotos todavía.</p>
            ) : (
              photos.map((path) => {
                const isMain = dog.main_image_url === path;
                return (
                  <div key={path} className="card" style={{ padding: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        height: 120,
                        background: `url(${path}) center/cover`,
                        backgroundColor: "#e8e8e8",
                      }}
                    />
                    <div style={{ padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {isMain ? (
                        <span className="tag" style={{ fontSize: "0.75rem", alignSelf: "flex-start" }}>
                          Portada
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                          disabled={photoBusy}
                          onClick={() => setMainPhoto(path)}
                        >
                          Hacer portada
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--warn, #b45309)" }}
                        disabled={photoBusy}
                        onClick={() => removePhoto(path)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadPhoto(file, photos.length === 0);
            }}
          />
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={photoBusy}
              onClick={() => fileRef.current?.click()}
            >
              {photoBusy ? "Subiendo…" : "Subir foto"}
            </button>
          </div>
        </section>
      ) : null}

      <form className="card" style={{ padding: "1.5rem" }} onSubmit={saveData}>
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Datos del perro</h2>
        <div className="field">
          <label>Estado de adopción</label>
          <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="available">Disponible — publicado en la web</option>
            <option value="reserved">Reservado — no publicado</option>
            <option value="adopted">Adoptado — no publicado</option>
            <option value="hidden">Oculto — no publicado</option>
          </select>
          <p style={{ margin: "0.35rem 0 0", fontSize: "0.85rem", color: "var(--muted)" }}>
            Solo el estado <strong>Disponible</strong> muestra el perro en el listado público y en las búsquedas de
            adoptantes.
          </p>
        </div>
        <div className="field">
          <label>Nombre</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Raza</label>
          <select value={f.breed} onChange={(e) => setF({ ...f, breed: e.target.value })}>
            {BREED_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Edad aproximada</label>
          <input value={f.age_estimate} onChange={(e) => setF({ ...f, age_estimate: e.target.value })} required />
        </div>
        <div className="field">
          <label>Tamaño</label>
          <select value={f.size} onChange={(e) => setF({ ...f, size: e.target.value })}>
            <option value="small">Pequeño</option>
            <option value="medium">Mediano</option>
            <option value="large">Grande</option>
          </select>
        </div>
        <div className="field">
          <label>Sexo</label>
          <select value={f.sex} onChange={(e) => setF({ ...f, sex: e.target.value })}>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
            <option value="unknown">Desconocido</option>
          </select>
        </div>
        <div className="field">
          <label>Provincia</label>
          <input value={f.province} onChange={(e) => setF({ ...f, province: e.target.value })} required />
        </div>
        <div className="field">
          <label>Ciudad</label>
          <input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} required />
        </div>
        <div className="field">
          <label>Energía</label>
          <select value={f.energy_level} onChange={(e) => setF({ ...f, energy_level: e.target.value })}>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
        {(
          [
            ["sociability_with_dogs", "Sociabilidad con perros"],
            ["sociability_with_cats", "Sociabilidad con gatos"],
            ["can_be_alone_hours", "Tolerancia a estar solo"],
          ] as const
        ).map(([k, label]) => (
          <div className="field" key={k}>
            <label>{label}</label>
            <select value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="unknown">Desconocido</option>
            </select>
          </div>
        ))}
        {(
          [
            ["good_with_children", "¿Bueno con niños?"],
            ["can_live_in_apartment", "¿Puede vivir en piso?"],
            ["needs_experience", "¿Requiere experiencia?"],
          ] as const
        ).map(([k, label]) => (
          <div className="field" key={k}>
            <label>{label}</label>
            <select value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })}>
              <option value="yes">Sí</option>
              <option value="no">No</option>
              <option value="unknown">Desconocido</option>
            </select>
          </div>
        ))}
        <div className="field">
          <label>Historia</label>
          <textarea value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} rows={3} />
        </div>
        <div className="field">
          <label>Comportamiento</label>
          <textarea value={f.behaviour_notes} onChange={(e) => setF({ ...f, behaviour_notes: e.target.value })} rows={3} />
        </div>
        <div className="field">
          <label>Hogar ideal</label>
          <textarea value={f.ideal_home} onChange={(e) => setF({ ...f, ideal_home: e.target.value })} rows={3} />
        </div>
        <div className="field">
          <label>Necesidades médicas</label>
          <textarea value={f.medical_needs} onChange={(e) => setF({ ...f, medical_needs: e.target.value })} rows={2} />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            style={{ color: "var(--warn, #b45309)" }}
            onClick={async () => {
              if (!dog || !window.confirm(`¿Eliminar la ficha de «${dog.name}»? Esta acción no se puede deshacer.`)) return;
              setLoading(true);
              setErr(null);
              try {
                await apiFetch(`/api/dogs/${dog.id}`, { method: "DELETE" });
                router.push(dog.shelter_id ? `/panel/refugios/${dog.shelter_id}` : "/panel/perros");
              } catch (e) {
                setErr(e instanceof Error ? e.message : "No se pudo eliminar");
              } finally {
                setLoading(false);
              }
            }}
          >
            Eliminar perro
          </button>
        </div>
      </form>
    </div>
  );
}

export default function PanelPerroEditarPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ padding: "2rem" }}>
          Cargando…
        </div>
      }
    >
      <PanelPerroEditarInner />
    </Suspense>
  );
}
