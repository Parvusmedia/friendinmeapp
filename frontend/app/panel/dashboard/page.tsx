"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearToken, getToken, parseJwt } from "@/lib/auth";

type Stats = {
  active_dogs: number;
  shelters_count: number;
  leads_count: number;
  adopters_count: number;
  top_contacted_dogs: { dog_id: number; name: string; leads: number }[];
  top_provinces_interest: { province: string; leads: number }[];
  avg_compatibility_score: number | null;
  leads_last_7_days: number;
  adopters_last_7_days: number;
  dogs_without_photo: number;
  dogs_incomplete_ficha: number;
};

export default function PanelDashboardPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/panel/login");
      return;
    }
    const p = parseJwt(t);
    setRole(p?.role || null);
    if (p?.role === "admin") {
      apiFetch("/api/admin/stats")
        .then((s) => setStats(s as Stats))
        .catch((e) => setErr(String(e.message)));
    }
  }, [router]);

  const logout = () => {
    clearToken();
    router.push("/panel/login");
  };

  const downloadCsv = async (path: string, filename: string) => {
    const t = getToken();
    const res = await fetch(path, { headers: { Authorization: `Bearer ${t}` } });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <h1 style={{ margin: 0 }}>Panel</h1>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Salir
        </button>
      </div>
      <p style={{ color: "var(--muted)" }}>Rol: {role || "—"}</p>
      {err ? <p className="notice">{err}</p> : null}

      <div className="grid-dogs" style={{ marginTop: "1.5rem" }}>
        <Link href="/panel/leads" className="card" style={{ padding: "1.25rem", textDecoration: "none", color: "inherit" }}>
          <h3 style={{ marginTop: 0 }}>Solicitudes de contacto</h3>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>Mensajes enviados a refugios por un perro concreto.</p>
        </Link>
        {role === "admin" ? (
          <Link href="/panel/adoptantes" className="card" style={{ padding: "1.25rem", textDecoration: "none", color: "inherit" }}>
            <h3 style={{ marginTop: 0 }}>Adoptantes</h3>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>Perfiles del cuestionario y actividad de match.</p>
          </Link>
        ) : null}
        <Link href="/panel/perros" className="card" style={{ padding: "1.25rem", textDecoration: "none", color: "inherit" }}>
          <h3 style={{ marginTop: 0 }}>Perros</h3>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>Gestionar fichas de tus perros.</p>
        </Link>
        {role === "admin" ? (
          <>
            <Link
              href="/panel/solicitudes-refugio"
              className="card"
              style={{ padding: "1.25rem", textDecoration: "none", color: "inherit" }}
            >
              <h3 style={{ marginTop: 0 }}>Solicitudes refugio</h3>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>Peticiones de alta pendientes.</p>
            </Link>
            <Link href="/panel/refugios" className="card" style={{ padding: "1.25rem", textDecoration: "none", color: "inherit" }}>
              <h3 style={{ marginTop: 0 }}>Refugios</h3>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>Alta manual y usuarios de refugio.</p>
            </Link>
            <Link
              href="/panel/partner-campaigns"
              className="card"
              style={{ padding: "1.25rem", textDecoration: "none", color: "inherit" }}
            >
              <h3 style={{ marginTop: 0 }}>Campañas partner</h3>
              <p style={{ color: "var(--muted)", marginBottom: 0 }}>
                Publicidad y recomendaciones patrocinadas en la web.
              </p>
            </Link>
          </>
        ) : null}
        <button
          type="button"
          className="card"
          style={{ padding: "1.25rem", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }}
          onClick={() => downloadCsv("/api/leads/export", "leads.csv")}
        >
          <h3 style={{ marginTop: 0 }}>Exportar leads CSV</h3>
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>Solicitudes de contacto.</p>
        </button>
        {role === "admin" ? (
          <button
            type="button"
            className="card"
            style={{ padding: "1.25rem", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }}
            onClick={() => downloadCsv("/api/admin/adopters/export", "adopters.csv")}
          >
            <h3 style={{ marginTop: 0 }}>Exportar adoptantes CSV</h3>
            <p style={{ color: "var(--muted)", marginBottom: 0 }}>Perfiles del cuestionario.</p>
          </button>
        ) : null}
      </div>

      {stats ? (
        <div className="card" style={{ marginTop: "2rem", padding: "1.5rem" }}>
          <h2 style={{ marginTop: 0 }}>Estadísticas (admin)</h2>
          <ul>
            <li>Perros disponibles: {stats.active_dogs}</li>
            <li>Refugios: {stats.shelters_count}</li>
            <li>Perfiles adoptantes: {stats.adopters_count}</li>
            <li>Solicitudes de contacto: {stats.leads_count}</li>
            <li>Leads últimos 7 días: {stats.leads_last_7_days}</li>
            <li>Cuestionarios nuevos (7 días): {stats.adopters_last_7_days}</li>
            <li>Perros sin foto: {stats.dogs_without_photo}</li>
            <li>Fichas incompletas (disponibles): {stats.dogs_incomplete_ficha}</li>
            <li>Media score compatibilidad (leads): {stats.avg_compatibility_score?.toFixed(1) ?? "—"}</li>
          </ul>
          <h4>Perros más contactados</h4>
          <ul>
            {stats.top_contacted_dogs.map((d) => (
              <li key={d.dog_id}>
                {d.name} (#{d.dog_id}): {d.leads}
              </li>
            ))}
          </ul>
          <h4>Provincias con más interés (leads)</h4>
          <ul>
            {stats.top_provinces_interest.map((p) => (
              <li key={p.province}>
                {p.province}: {p.leads}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
