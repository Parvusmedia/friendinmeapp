"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";
import {
  campaignScheduleLabel,
  type PartnerCampaignAdmin,
} from "@/lib/partner-campaign-admin";
import { PLACEMENT_LABELS, type PartnerPlacementId } from "@/lib/partner-placements";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function PanelPartnerCampaignsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PartnerCampaignAdmin[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch("/api/partner-campaigns")
      .then((d) => setRows(d as PartnerCampaignAdmin[]))
      .catch((e) => setErr(e instanceof Error ? e.message : "Error al cargar"));
  }, []);

  useEffect(() => {
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (!t || p?.role !== "admin") {
      router.replace("/panel/dashboard");
      return;
    }
    load();
  }, [router, load]);

  const toggleActive = async (row: PartnerCampaignAdmin) => {
    await apiFetch(`/api/partner-campaigns/${row.id}`, {
      method: "PATCH",
      body: JSON.stringify({ active: !row.active }),
    });
    load();
  };

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 1100 }}>
      <p>
        <Link href="/panel/dashboard">← Dashboard</Link>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={{ margin: 0, flex: "1 1 auto" }}>Campañas partner</h1>
        <Link href="/panel/partner-campaigns/nuevo" className="btn btn-primary">
          Nueva campaña
        </Link>
      </div>
      <p style={{ color: "var(--muted)", marginTop: 0, maxWidth: 720, lineHeight: 1.55 }}>
        Gestiona los bloques patrocinados en ficha de perro, compatibilidad y solicitudes. Puedes activar o desactivar,
        programar fechas de inicio y fin, y editar el contenido. Variables en textos:{" "}
        <code>{"{dogName}"}</code>, <code>{"{sizeLabel}"}</code>, <code>{"{energyLabel}"}</code>,{" "}
        <code>{"{ageLabel}"}</code>, <code>{"{productName}"}</code>, <code>{"{discountCode}"}</code>.
      </p>
      {err ? <p className="notice">{err}</p> : null}

      {rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No hay campañas. Crea una o ejecuta la migración en el servidor.</p>
      ) : (
        <div className="panel-table-wrap">
          <table className="panel-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ubicación</th>
                <th>Partner</th>
                <th>Prioridad</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td style={{ fontSize: "0.85rem" }}>
                    {PLACEMENT_LABELS[r.placement as PartnerPlacementId] ?? r.placement}
                  </td>
                  <td>{r.sponsor_name}</td>
                  <td>{r.priority}</td>
                  <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>{formatDate(r.starts_at)}</td>
                  <td style={{ fontSize: "0.82rem", whiteSpace: "nowrap" }}>{formatDate(r.ends_at)}</td>
                  <td>
                    <span className="tag">{campaignScheduleLabel(r)}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      <Link
                        href={`/panel/partner-campaigns/${r.id}`}
                        className="btn btn-secondary"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}
                        onClick={() => toggleActive(r)}
                      >
                        {r.active ? "Desactivar" : "Activar"}
                      </button>
                    </div>
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
