"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";
import {
  campaignToForm,
  EMPTY_CAMPAIGN_FORM,
  formToPayload,
  type PartnerCampaignForm,
} from "@/lib/partner-campaign-admin";
import { PLACEMENT_LABELS, type PartnerPlacementId } from "@/lib/partner-placements";

export default function PanelPartnerCampaignEditPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id as string;
  const isNew = rawId === "nuevo";
  const id = isNew ? null : Number(rawId);

  const [form, setForm] = useState<PartnerCampaignForm>(EMPTY_CAMPAIGN_FORM);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = getToken();
    const p = t ? parseJwt(t) : null;
    if (!t || p?.role !== "admin") {
      router.replace("/panel/dashboard");
      return;
    }
    if (isNew) return;
    if (!Number.isFinite(id)) {
      setErr("ID no válido");
      return;
    }
    apiFetch(`/api/partner-campaigns/${id}`)
      .then((row) => setForm(campaignToForm(row as Parameters<typeof campaignToForm>[0])))
      .catch((e) => setErr(e instanceof Error ? e.message : "No encontrada"))
      .finally(() => setLoading(false));
  }, [router, isNew, id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload = formToPayload(form);
      if (isNew) {
        await apiFetch("/api/partner-campaigns", { method: "POST", body: JSON.stringify(payload) });
      } else {
        await apiFetch(`/api/partner-campaigns/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      }
      router.push("/panel/partner-campaigns");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (isNew || !id) return;
    if (!confirm("¿Eliminar esta campaña?")) return;
    try {
      await apiFetch(`/api/partner-campaigns/${id}`, { method: "DELETE" });
      router.push("/panel/partner-campaigns");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p style={{ color: "var(--muted)" }}>Cargando…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 720 }}>
      <p>
        <Link href="/panel/partner-campaigns">← Campañas partner</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>{isNew ? "Nueva campaña" : "Editar campaña"}</h1>
      {err ? <p className="notice">{err}</p> : null}

      <form className="card" style={{ padding: "1.5rem" }} onSubmit={save}>
        <div className="field">
          <label>Nombre interno (admin)</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Ubicación en la web</label>
          <select
            value={form.placement}
            onChange={(e) => setForm({ ...form, placement: e.target.value as PartnerPlacementId })}
          >
            {(Object.keys(PLACEMENT_LABELS) as PartnerPlacementId[]).map((k) => (
              <option key={k} value={k}>
                {PLACEMENT_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field">
            <label>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />{" "}
              Activa
            </label>
          </div>
          <div className="field">
            <label>Prioridad (mayor = gana)</label>
            <input
              type="number"
              min={0}
              max={1000}
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
            />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field">
            <label>Inicio (opcional)</label>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Fin (opcional)</label>
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>Nombre del partner (pie de bloque)</label>
          <input
            value={form.sponsor_name}
            onChange={(e) => setForm({ ...form, sponsor_name: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label>Icono (emoji, opcional)</label>
          <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} maxLength={8} />
        </div>
        <div className="field">
          <label>Título</label>
          <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} required />
        </div>
        <div className="field">
          <label>Texto principal</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} required />
        </div>
        <div className="field">
          <label>Viñetas (una por línea, opcional)</label>
          <textarea
            value={form.bulletsText}
            onChange={(e) => setForm({ ...form, bulletsText: e.target.value })}
            rows={4}
          />
        </div>
        <div className="field">
          <label>Texto del botón</label>
          <input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} required />
        </div>
        <div className="field">
          <label>URL del botón</label>
          <input
            type="url"
            value={form.cta_url}
            onChange={(e) => setForm({ ...form, cta_url: e.target.value })}
            required
          />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="field">
            <label>Código descuento (opcional)</label>
            <input value={form.discount_code} onChange={(e) => setForm({ ...form, discount_code: e.target.value })} />
          </div>
          <div className="field">
            <label>Nota descuento (opcional)</label>
            <input value={form.discount_note} onChange={(e) => setForm({ ...form, discount_note: e.target.value })} />
          </div>
        </div>
        <h2 style={{ fontSize: "1rem", margin: "1.25rem 0 0.5rem" }}>Segmentación por perro (opcional)</h2>
        <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: "0 0 0.75rem" }}>
          Valores separados por comas. Vacío = cualquier perro. Tamaño: small, medium, large · Energía: low, medium, high ·
          Edad: puppy, young, adult, senior
        </p>
        <div className="field">
          <label>Tamaños</label>
          <input value={form.match_sizes} onChange={(e) => setForm({ ...form, match_sizes: e.target.value })} />
        </div>
        <div className="field">
          <label>Energías</label>
          <input
            value={form.match_energy_levels}
            onChange={(e) => setForm({ ...form, match_energy_levels: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Edades</label>
          <input value={form.match_age_stages} onChange={(e) => setForm({ ...form, match_age_stages: e.target.value })} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </button>
          {!isNew ? (
            <button type="button" className="btn btn-secondary" onClick={remove}>
              Eliminar
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
