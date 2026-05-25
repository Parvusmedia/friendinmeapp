"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";
import {
  EMPTY_SHELTER_FORM,
  SHELTER_TEXT_FIELDS,
  shelterPayload,
  shelterToForm,
  type ShelterFormState,
} from "@/lib/shelter-fields";

type Shelter = ShelterFormState & { id: number };

type ShelterDog = { id: number; name: string; status: string; city: string; province: string; breed: string };
type ShelterUser = { id: number; email: string };

type ManagePayload = {
  shelter: Shelter;
  dog_count: number;
  user_count: number;
  users: ShelterUser[];
  dogs: ShelterDog[];
};

function parseShelterId(params: ReturnType<typeof useParams>): number | null {
  const raw = params?.id;
  const idStr = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const n = Number(idStr);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function PanelRefugioDetalleInner() {
  const params = useParams();
  const router = useRouter();
  const shelterId = parseShelterId(params);

  const [data, setData] = useState<ManagePayload | null>(null);
  const [form, setForm] = useState<ShelterFormState>(EMPTY_SHELTER_FORM);
  const [reg, setReg] = useState({ email: "", password: "" });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!shelterId) return;
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (!t || p?.role !== "admin") {
      router.replace("/panel/dashboard");
      return;
    }
    const m = (await apiFetch(`/api/shelters/${shelterId}/manage`)) as ManagePayload;
    setData(m);
    const s = m.shelter;
    setForm(shelterToForm(s));
  }, [shelterId, router]);

  useEffect(() => {
    load().catch((e) => setErr(e instanceof Error ? e.message : "Error al cargar"));
  }, [load]);

  const saveShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterId) return;
    setErr(null);
    setLoading(true);
    try {
      await apiFetch(`/api/shelters/${shelterId}`, {
        method: "PUT",
        body: JSON.stringify(shelterPayload(form)),
      });
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const deleteShelter = async () => {
    if (!shelterId || !data) return;
    if (
      !window.confirm(
        `¿Eliminar el refugio «${data.shelter.name}»? Solo es posible si no tiene perros ni usuarios vinculados.`
      )
    ) {
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      await apiFetch(`/api/shelters/${shelterId}`, { method: "DELETE" });
      router.push("/panel/refugios");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo eliminar");
    } finally {
      setLoading(false);
    }
  };

  const deleteDog = async (dog: ShelterDog) => {
    if (!window.confirm(`¿Eliminar la ficha de «${dog.name}»? Se borrarán también sus leads y matches.`)) return;
    setErr(null);
    try {
      await apiFetch(`/api/dogs/${dog.id}`, { method: "DELETE" });
      await load();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al eliminar perro");
    }
  };

  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shelterId) return;
    setErr(null);
    try {
      await apiFetch("/api/auth/register-shelter-user", {
        method: "POST",
        body: JSON.stringify({
          email: reg.email,
          password: reg.password,
          shelter_id: shelterId,
        }),
      });
      setReg({ email: "", password: "" });
      await load();
      alert("Usuario creado.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al crear usuario");
    }
  };

  if (!shelterId) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <p className="notice">Refugio no válido.</p>
        <Link href="/panel/refugios">Volver al listado</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <p style={{ color: "var(--muted)" }}>{err || "Cargando refugio…"}</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 800 }}>
      <p>
        <Link href="/panel/refugios">← Refugios</Link>
        {" · "}
        <Link href="/panel/dashboard">Dashboard</Link>
      </p>
      <h1 style={{ marginTop: "0.5rem" }}>{data.shelter.name}</h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        #{data.shelter.id} · {data.dog_count} perro(s) · {data.user_count} usuario(s)
      </p>
      {err ? <p className="notice">{err}</p> : null}

      <section className="card" style={{ padding: "1.25rem", marginTop: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Ficha del refugio</h2>
        <form onSubmit={saveShelter}>
          {SHELTER_TEXT_FIELDS.map(({ key, label, required, type, placeholder }) => (
            <div className="field" key={key}>
              <label>{label}</label>
              <input
                type={type || "text"}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required={required}
              />
            </div>
          ))}
          <div className="field">
            <label>Descripción</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando…" : "Guardar cambios"}
            </button>
            <button type="button" className="btn btn-secondary" disabled={loading} onClick={deleteShelter}>
              Eliminar refugio
            </button>
          </div>
        </form>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Perros del refugio</h2>
          <Link href={`/panel/perros/nuevo?shelter_id=${shelterId}`} className="btn btn-primary">
            Añadir perro
          </Link>
        </div>
        {data.dogs.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No hay perros registrados.</p>
        ) : (
          <div className="stack" style={{ gap: "0.75rem", marginTop: "1rem" }}>
            {data.dogs.map((d) => (
              <div
                key={d.id}
                className="card"
                style={{ padding: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}
              >
                <div>
                  <strong>{d.name}</strong> <span className="tag">{d.status}</span>
                  <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                    {d.breed} · {d.city}, {d.province}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link href={`/panel/perros/${d.id}`} className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
                    Editar
                  </Link>
                  <Link href={`/perros/${d.id}`} className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }}>
                    Ver público
                  </Link>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: "0.85rem", padding: "0.35rem 0.75rem" }} onClick={() => deleteDog(d)}>
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card" style={{ padding: "1.25rem", marginTop: "2rem" }}>
        <h2 style={{ marginTop: 0 }}>Usuarios del refugio</h2>
        {data.users.length ? (
          <ul>
            {data.users.map((u) => (
              <li key={u.id}>
                #{u.id} — {u.email}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "var(--muted)" }}>Sin usuarios de acceso al panel.</p>
        )}
        <h3 style={{ marginTop: "1.25rem" }}>Crear usuario de acceso</h3>
        <form onSubmit={registerUser}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} required />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-secondary">
            Crear usuario
          </button>
        </form>
      </section>
    </div>
  );
}

export default function PanelRefugioDetallePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "2rem" }}>Cargando…</div>}>
      <PanelRefugioDetalleInner />
    </Suspense>
  );
}
