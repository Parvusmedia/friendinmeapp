"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { cancelAdopterLead, fetchAdopterLeads, type AdopterLead } from "@/lib/adopter-leads";
import { getStoredAdopterEmail, getStoredAdopterId, resolveStoredAdopter } from "@/lib/adopter-session";
import {
  canAdopterCancel,
  leadStatusLabel,
  leadStatusShort,
  leadStatusTagClass,
} from "@/lib/lead-status";
import { PartnerPlacement } from "@/components/PartnerPlacement";
import { resolveMediaUrl } from "@/lib/media-url";
import styles from "./mis-solicitudes.module.css";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-ES", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export default function MisSolicitudesPage() {
  const [rows, setRows] = useState<AdopterLead[]>([]);
  const [adopterId, setAdopterId] = useState<number | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    let id = getStoredAdopterId();
    let em = getStoredAdopterEmail();
    if (!id || !em) {
      const profile = await resolveStoredAdopter();
      if (profile) {
        id = profile.id;
        em = profile.email;
      }
    }
    if (!id || !em) {
      setLoading(false);
      setErr("Completa el cuestionario para ver tus solicitudes.");
      return;
    }
    setAdopterId(id);
    setEmail(em);
    try {
      const list = await fetchAdopterLeads(id, em);
      setRows(list);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (lead: AdopterLead) => {
    if (!adopterId || !email) return;
    if (!confirm(`¿Cancelar tu solicitud para ${lead.dog_name}?`)) return;
    setCancellingId(lead.id);
    setErr(null);
    try {
      await cancelAdopterLead(lead.id, adopterId, email);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cancelar");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className={`container ${styles.page}`}>
      <h1 style={{ marginTop: 0 }}>Mis solicitudes</h1>
      <p className={styles.lead}>
        Aquí ves las solicitudes de contacto que has enviado a refugios. El estado lo actualiza el refugio cuando
        responde o avanza el proceso.
      </p>

      {loading ? <p style={{ color: "var(--muted)" }}>Cargando…</p> : null}
      {err ? (
        <p className="notice">
          {err}{" "}
          <Link href="/cuestionario">Ir al cuestionario</Link>
        </p>
      ) : null}

      {!loading && !err && rows.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          Aún no has enviado ninguna solicitud.{" "}
          <Link href="/perros">Explorar perros</Link>
        </p>
      ) : null}

      <div className="stack" style={{ gap: "0.85rem" }}>
        {rows.map((r) => (
          <article key={r.id} className={`card ${styles.row}`}>
            <div className={styles.photo}>
              {r.dog_main_image_url ? (
                <Image
                  src={resolveMediaUrl(r.dog_main_image_url)}
                  alt=""
                  fill
                  className={styles.photoImg}
                  sizes="64px"
                  unoptimized
                />
              ) : (
                <div className={styles.photoEmpty} aria-hidden />
              )}
            </div>
            <div className={styles.body}>
              <p className={styles.title}>
                <Link href={`/perros/${r.dog_id}`}>{r.dog_name}</Link>
              </p>
              <p className={styles.meta}>
                {r.shelter_name} · Compatibilidad {Math.round(r.compatibility_score)}%
              </p>
              <span className={leadStatusTagClass(r.status)} title={leadStatusLabel(r.status)}>
                {leadStatusShort(r.status)}
              </span>
              <p className={styles.meta} style={{ marginTop: "0.35rem", fontSize: "0.82rem" }}>
                {leadStatusLabel(r.status)}
              </p>
              {r.message ? <p className={styles.message}>{r.message}</p> : null}
              <p className={styles.date}>Enviada el {formatDate(r.created_at)}</p>
              <div className={styles.actions}>
                <Link href={`/perros/${r.dog_id}`} className="btn btn-secondary" style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}>
                  Ver ficha
                </Link>
                {canAdopterCancel(r.status) ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                    disabled={cancellingId === r.id}
                    onClick={() => cancel(r)}
                  >
                    {cancellingId === r.id ? "Cancelando…" : "Cancelar solicitud"}
                  </button>
                ) : null}
              </div>
              {r.status === "new" || r.status === "contacted" || r.status === "in_process" ? (
                <PartnerPlacement
                  placement="lead_list_pending"
                  compact
                  context={{ dogId: r.dog_id, dogName: r.dog_name }}
                />
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/perros">← Ver más perros</Link>
      </p>
    </div>
  );
}
