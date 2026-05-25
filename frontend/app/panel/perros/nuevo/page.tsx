"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";
import { BREED_OPTIONS } from "@/lib/breeds";

type ShelterOpt = { id: number; name: string };

function PanelPerrosNuevoInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetShelter = searchParams.get("shelter_id");
  const [shelters, setShelters] = useState<ShelterOpt[]>([]);
  const [err, setErr] = useState<string | null>(null);
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
    shelter_id: (presetShelter || "") as string | number,
  });

  useEffect(() => {
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (p?.role === "admin") {
      apiFetch("/api/shelters")
        .then((list) => setShelters(list as ShelterOpt[]))
        .catch(() => setShelters([]));
    }
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    const t = getToken();
    if (!t) {
      router.replace("/panel/login");
      return;
    }
    const p = parseJwt(t);
    const body: Record<string, unknown> = {
      name: f.name,
      breed: f.breed,
      age_estimate: f.age_estimate,
      size: f.size,
      sex: f.sex,
      province: f.province,
      city: f.city,
      energy_level: f.energy_level,
      sociability_with_dogs: f.sociability_with_dogs,
      sociability_with_cats: f.sociability_with_cats,
      good_with_children: f.good_with_children,
      can_live_in_apartment: f.can_live_in_apartment,
      needs_experience: f.needs_experience,
      can_be_alone_hours: f.can_be_alone_hours,
      medical_needs: f.medical_needs,
      behaviour_notes: f.behaviour_notes,
      story: f.story,
      ideal_home: f.ideal_home,
      images: [],
    };
    if (p?.role === "admin" && f.shelter_id !== "") body.shelter_id = Number(f.shelter_id);
    try {
      await apiFetch("/api/dogs", { method: "POST", body: JSON.stringify(body) });
      const sid = p?.role === "admin" && f.shelter_id !== "" ? Number(f.shelter_id) : null;
      router.push(sid ? `/panel/refugios/${sid}` : "/panel/perros");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error");
    }
  };

  const role = typeof window !== "undefined" ? parseJwt(getToken() || "")?.role : null;

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 640 }}>
      <p>
        <Link href="/panel/perros">← Perros</Link>
        {presetShelter ? (
          <>
            {" · "}
            <Link href={`/panel/refugios/${presetShelter}`}>← Refugio</Link>
          </>
        ) : null}
      </p>
      <h1 style={{ marginTop: 0 }}>Nuevo perro</h1>
      <form className="card" style={{ padding: "1.5rem" }} onSubmit={submit}>
        {role === "admin" ? (
          <div className="field">
            <label>Refugio</label>
            <select value={f.shelter_id} onChange={(e) => setF({ ...f, shelter_id: e.target.value })} required>
              <option value="">Selecciona refugio…</option>
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.id} {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="field">
          <label>Nombre</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Raza (orientativa)</label>
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
            ["can_be_alone_hours", "Tolerancia a estar solo (baja/med/alta)"],
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
          <textarea value={f.story} onChange={(e) => setF({ ...f, story: e.target.value })} />
        </div>
        <div className="field">
          <label>Notas comportamiento</label>
          <textarea value={f.behaviour_notes} onChange={(e) => setF({ ...f, behaviour_notes: e.target.value })} />
        </div>
        <div className="field">
          <label>Hogar ideal</label>
          <textarea value={f.ideal_home} onChange={(e) => setF({ ...f, ideal_home: e.target.value })} />
        </div>
        <div className="field">
          <label>Necesidades médicas</label>
          <textarea value={f.medical_needs} onChange={(e) => setF({ ...f, medical_needs: e.target.value })} />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <button className="btn btn-primary" type="submit">
          Guardar
        </button>
      </form>
    </div>
  );
}

export default function PanelPerrosNuevoPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "2rem" }}>Cargando…</div>}>
      <PanelPerrosNuevoInner />
    </Suspense>
  );
}
