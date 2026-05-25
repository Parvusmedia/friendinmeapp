"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";

type AdopterRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  created_at: string;
  consent_contact: boolean;
  consent_marketing: boolean;
  leads_count: number;
  matches_count: number;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function PanelAdoptantesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<AdopterRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (!t) {
      router.replace("/panel/login");
      return;
    }
    if (p?.role !== "admin") {
      router.replace("/panel/dashboard");
      return;
    }
    apiFetch("/api/admin/adopters")
      .then((d) => setRows(d as AdopterRow[]))
      .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
  }, [router]);

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 1100 }}>
      <p>
        <Link href="/panel/dashboard">← Dashboard</Link>
        {" · "}
        <Link href="/panel/leads">Solicitudes de contacto</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Adoptantes</h1>
      <p style={{ color: "var(--muted)", marginTop: "-0.25rem" }}>
        Personas que completaron el cuestionario (match) y pueden haber enviado solicitudes a refugios.
      </p>
      {err ? <p className="notice">{err}</p> : null}
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        {rows.length} perfil{rows.length === 1 ? "" : "es"}
      </p>

      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>Aún no hay perfiles de adoptantes.</p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Ubicación</th>
                <th>Matches</th>
                <th>Solicitudes</th>
                <th>Alta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ color: "var(--muted)" }}>{r.id}</td>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td>
                    <a href={`mailto:${r.email}`}>{r.email}</a>
                  </td>
                  <td>{r.phone}</td>
                  <td>
                    {r.city}, {r.province}
                  </td>
                  <td>{r.matches_count}</td>
                  <td>{r.leads_count}</td>
                  <td style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>{formatDate(r.created_at)}</td>
                  <td>
                    <Link
                      href={`/panel/adoptantes/${r.id}`}
                      className="btn btn-primary"
                      style={{ padding: "0.3rem 0.65rem", fontSize: "0.82rem" }}
                    >
                      Ver ficha
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
