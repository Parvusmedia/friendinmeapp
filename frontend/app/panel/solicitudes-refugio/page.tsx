"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";

type Application = {
  id: number;
  organization_name: string;
  contact_name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  message: string;
  description: string;
  status: string;
  created_at: string;
  created_shelter_id: number | null;
};

export default function PanelSolicitudesRefugioPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Application[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "">("pending");

  const load = () => {
    const qs = filter ? `?status=${filter}` : "";
    apiFetch(`/api/shelter-applications${qs}`)
      .then((d) => setRows(d as Application[]))
      .catch((e) => setErr(String(e.message)));
  };

  useEffect(() => {
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (!t || p?.role !== "admin") {
      router.replace("/panel/dashboard");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, router]);

  const approve = async (id: number) => {
    if (!confirm("¿Aprobar y crear el refugio en el sistema?")) return;
    setErr(null);
    try {
      const res = (await apiFetch(`/api/shelter-applications/${id}/approve`, { method: "POST" })) as {
        shelter_id: number;
      };
      alert(`Refugio creado con ID ${res.shelter_id}. Crea el usuario en Refugios → Registrar usuario.`);
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  const reject = async (id: number) => {
    const notes = prompt("Motivo del rechazo (opcional):") ?? "";
    setErr(null);
    try {
      await apiFetch(`/api/shelter-applications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ admin_notes: notes }),
      });
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 900 }}>
      <p>
        <Link href="/panel/dashboard">← Dashboard</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Solicitudes de alta de refugio</h1>
      <p style={{ color: "var(--muted)" }}>
        Revisa peticiones públicas desde <Link href="/refugio/solicitud">/refugio/solicitud</Link>.
      </p>

      <div style={{ marginBottom: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className={filter === "pending" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => setFilter("pending")}
        >
          Pendientes
        </button>
        <button
          type="button"
          className={filter === "" ? "btn btn-primary" : "btn btn-secondary"}
          onClick={() => setFilter("")}
        >
          Todas
        </button>
      </div>

      {err ? <p className="notice">{err}</p> : null}

      {rows.length === 0 ? (
        <p>No hay solicitudes en este filtro.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {rows.map((r) => (
            <li key={r.id} className="card" style={{ padding: "1rem", marginBottom: "0.75rem" }}>
              <strong>
                #{r.id} {r.organization_name}
              </strong>{" "}
              <span style={{ color: "var(--muted)", fontSize: "0.9rem" }}>({r.status})</span>
              <p style={{ margin: "0.5rem 0" }}>
                {r.contact_name} · {r.email} · {r.phone}
                <br />
                {r.city}, {r.province}
              </p>
              {r.description ? <p style={{ margin: "0.35rem 0", fontSize: "0.95rem" }}>{r.description}</p> : null}
              {r.message ? (
                <p style={{ margin: "0.35rem 0", fontSize: "0.95rem", color: "var(--muted)" }}>{r.message}</p>
              ) : null}
              {r.status === "pending" ? (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
                  <button type="button" className="btn btn-primary" onClick={() => approve(r.id)}>
                    Aprobar y crear refugio
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => reject(r.id)}>
                    Rechazar
                  </button>
                </div>
              ) : r.created_shelter_id ? (
                <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  Refugio ID: {r.created_shelter_id} —{" "}
                  <Link href="/panel/refugios">Registrar usuario</Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
