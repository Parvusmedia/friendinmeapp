"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";

type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  housing_type: string;
  has_children: boolean;
  has_other_dogs: boolean;
  has_cats: boolean;
  preferred_sizes: string[];
  breed_preferences: string[];
  province_preference: string;
  adoption_reason: string;
  important_notes: string;
  consent_contact: boolean;
  consent_marketing: boolean;
  created_at: string;
};

type LeadBrief = {
  id: number;
  dog_id: number;
  dog_name: string;
  compatibility_score: number;
  status: string;
  message: string;
  created_at: string;
};

type Detail = {
  profile: Profile;
  leads_count: number;
  matches_count: number;
  leads: LeadBrief[];
};

const HOUSING: Record<string, string> = {
  apartment: "Piso",
  house: "Casa",
  house_with_garden: "Casa con jardín",
  rural: "Rural",
  other: "Otro",
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

function PanelAdoptanteDetalleInner() {
  const params = useParams();
  const router = useRouter();
  const raw = params?.id;
  const idStr = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
  const adopterId = Number(idStr);

  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(adopterId) || adopterId <= 0) return;
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
    apiFetch(`/api/admin/adopters/${adopterId}`)
      .then((d) => setData(d as Detail))
      .catch((e) => setErr(e instanceof Error ? e.message : "Error"));
  }, [adopterId, router]);

  if (!Number.isFinite(adopterId) || adopterId <= 0) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <p className="notice">ID no válido</p>
        <Link href="/panel/adoptantes">Volver</Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container" style={{ padding: "2rem 0" }}>
        <p style={{ color: "var(--muted)" }}>{err || "Cargando…"}</p>
      </div>
    );
  }

  const p = data.profile;

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 900 }}>
      <p>
        <Link href="/panel/adoptantes">← Adoptantes</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>{p.name}</h1>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        #{p.id} · {formatDate(p.created_at)} · {data.matches_count} match(es) calculado(s) · {data.leads_count}{" "}
        solicitud(es) a refugio
      </p>
      {err ? <p className="notice">{err}</p> : null}

      <section className="card" style={{ padding: "1.25rem", marginTop: "1.5rem" }}>
        <h2 style={{ marginTop: 0 }}>Contacto</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.7 }}>
          <li>
            <a href={`mailto:${p.email}`}>{p.email}</a> · {p.phone}
          </li>
          <li>
            {p.city}, {p.province}
          </li>
          <li>
            Consentimiento contacto refugio: {p.consent_contact ? "Sí" : "No"} · Marketing:{" "}
            {p.consent_marketing ? "Sí" : "No"}
          </li>
        </ul>
      </section>

      <section className="card" style={{ padding: "1.25rem", marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Perfil de adopción</h2>
        <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: 1.7 }}>
          <li>Vivienda: {HOUSING[p.housing_type] || p.housing_type}</li>
          <li>
            Niños: {p.has_children ? "Sí" : "No"} · Otro perro: {p.has_other_dogs ? "Sí" : "No"} · Gatos:{" "}
            {p.has_cats ? "Sí" : "No"}
          </li>
          <li>
            Tamaños preferidos: {p.preferred_sizes.length ? p.preferred_sizes.join(", ") : "Sin preferencia"}
          </li>
          <li>
            Razas preferidas: {p.breed_preferences.length ? p.breed_preferences.join(", ") : "Sin preferencia"}
          </li>
          {p.province_preference ? <li>Provincia preferida: {p.province_preference}</li> : null}
          {p.adoption_reason ? <li>Motivo: {p.adoption_reason}</li> : null}
          {p.important_notes ? <li>Notas: {p.important_notes}</li> : null}
        </ul>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2 style={{ marginTop: 0 }}>Solicitudes de contacto a refugios</h2>
        {data.leads.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No ha enviado solicitudes de contacto todavía.</p>
        ) : (
          <div className="panel-table-wrap">
            <table className="panel-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Perro</th>
                  <th>Score</th>
                  <th>Estado</th>
                  <th>Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((l) => (
                  <tr key={l.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }}>{formatDate(l.created_at)}</td>
                    <td>
                      <Link href={`/panel/perros/${l.dog_id}`}>{l.dog_name}</Link>
                      <span style={{ color: "var(--muted)" }}> #{l.dog_id}</span>
                    </td>
                    <td>{l.compatibility_score}</td>
                    <td>
                      <span className="tag">{l.status}</span>
                    </td>
                    <td style={{ maxWidth: 280 }}>{l.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function PanelAdoptanteDetallePage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "2rem" }}>Cargando…</div>}>
      <PanelAdoptanteDetalleInner />
    </Suspense>
  );
}
