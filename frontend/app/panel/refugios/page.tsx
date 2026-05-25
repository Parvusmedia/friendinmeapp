"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";
import { EMPTY_SHELTER_FORM, SHELTER_TEXT_FIELDS, shelterPayload, type ShelterFormState } from "@/lib/shelter-fields";

type Shelter = { id: number; name: string; email: string; city: string; province: string };

export default function PanelRefugiosPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Shelter[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState<ShelterFormState>(EMPTY_SHELTER_FORM);
  const [reg, setReg] = useState({ shelter_id: "", email: "", password: "" });

  useEffect(() => {
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (!t || p?.role !== "admin") {
      router.replace("/panel/dashboard");
      return;
    }
    apiFetch("/api/shelters")
      .then((d) => setRows(d as Shelter[]))
      .catch((e) => setErr(String(e.message)));
  }, [router]);

  const createShelter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await apiFetch("/api/shelters", { method: "POST", body: JSON.stringify(shelterPayload(form)) });
      const list = (await apiFetch("/api/shelters")) as Shelter[];
      setRows(list);
      setForm(EMPTY_SHELTER_FORM);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error");
    }
  };

  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      await apiFetch("/api/auth/register-shelter-user", {
        method: "POST",
        body: JSON.stringify({
          email: reg.email,
          password: reg.password,
          shelter_id: Number(reg.shelter_id),
        }),
      });
      alert("Usuario creado. Ya puede iniciar sesión.");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 960 }}>
      <p>
        <Link href="/panel/dashboard">← Dashboard</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Refugios (admin)</h1>
      {err ? <p className="notice">{err}</p> : null}
      <h2>Listado</h2>
      <p style={{ color: "var(--muted)", marginTop: "-0.5rem", fontSize: "0.9rem" }}>
        {rows.length} refugio{rows.length === 1 ? "" : "s"}
      </p>
      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No hay refugios registrados.</p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id}>
                  <td style={{ color: "var(--muted)", width: 48 }}>{s.id}</td>
                  <td>
                    <strong>{s.name}</strong>
                  </td>
                  <td>
                    {s.city}, {s.province}
                  </td>
                  <td>
                    <a href={`mailto:${s.email}`} style={{ color: "inherit" }}>
                      {s.email}
                    </a>
                  </td>
                  <td>
                    <div className="panel-table-actions">
                      <Link
                        href={`/panel/refugios/${s.id}`}
                        className="btn btn-primary"
                        style={{ padding: "0.3rem 0.65rem", fontSize: "0.82rem" }}
                      >
                        Gestionar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2>Crear refugio</h2>
      <form className="card" style={{ padding: "1rem", marginBottom: "1.5rem" }} onSubmit={createShelter}>
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
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <button className="btn btn-primary" type="submit">
          Crear
        </button>
      </form>
      <h2>Registrar usuario de refugio</h2>
      <form className="card" style={{ padding: "1rem" }} onSubmit={registerUser}>
        <div className="field">
          <label>Shelter ID</label>
          <input type="number" value={reg.shelter_id} onChange={(e) => setReg({ ...reg, shelter_id: e.target.value })} required />
        </div>
        <div className="field">
          <label>Email usuario</label>
          <input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} required />
        </div>
        <button className="btn btn-secondary" type="submit">
          Crear usuario
        </button>
      </form>
    </div>
  );
}
