"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";

type Lead = {
  id: number;
  adopter_profile_id: number;
  dog_id: number;
  name: string;
  email: string;
  phone: string;
  province: string;
  message: string;
  compatibility_score: number;
  status: string;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function PanelLeadsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Lead[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = useCallback(() => {
    const t = getToken();
    if (!t) {
      router.replace("/panel/login");
      return;
    }
    setIsAdmin(parseJwt(t)?.role === "admin");
    apiFetch("/api/leads")
      .then((d) => setRows(d as Lead[]))
      .catch((e) => setErr(String(e.message)));
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: number, status: string) => {
    await apiFetch(`/api/leads/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    load();
  };

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 1100 }}>
      <p>
        <Link href="/panel/dashboard">← Dashboard</Link>
        {isAdmin ? (
          <>
            {" · "}
            <Link href="/panel/adoptantes">Adoptantes</Link>
          </>
        ) : null}
      </p>
      <h1 style={{ marginTop: 0 }}>Solicitudes de contacto</h1>
      <p style={{ color: "var(--muted)", marginTop: "-0.25rem" }}>
        Cada fila es un mensaje de un adoptante a un refugio por un perro concreto.
      </p>
      {err ? <p className="notice">{err}</p> : null}
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        {rows.length} solicitud{rows.length === 1 ? "" : "es"}
      </p>

      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No hay solicitudes.</p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Adoptante</th>
                <th>Perro</th>
                <th>Score</th>
                <th>Estado</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>{formatDate(r.created_at)}</td>
                  <td>
                    <strong>{r.name}</strong>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
                      {r.email}
                      {isAdmin ? (
                        <>
                          {" · "}
                          <Link href={`/panel/adoptantes/${r.adopter_profile_id}`}>Perfil #{r.adopter_profile_id}</Link>
                        </>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <Link href={`/panel/perros/${r.dog_id}`}>#{r.dog_id}</Link>
                  </td>
                  <td>{r.compatibility_score}</td>
                  <td>
                    <select
                      value={r.status}
                      onChange={(e) => patch(r.id, e.target.value)}
                      style={{ fontSize: "0.85rem", maxWidth: 130 }}
                    >
                      {["new", "contacted", "in_process", "adopted", "rejected", "archived", "cancelled"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ maxWidth: 220, fontSize: "0.9rem" }}>{r.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
