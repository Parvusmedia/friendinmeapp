"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";
import {
  DOG_STATUS_OPTIONS,
  type DogStatusValue,
  dogStatusLabel,
  dogStatusTagClass,
  isDogPublished,
} from "@/lib/dog-status";
import styles from "./perros-panel.module.css";

type Dog = {
  id: number;
  name: string;
  status: string;
  province: string;
  city: string;
  shelter_id?: number;
  photo_count?: number;
};

type StatusFilter = "" | DogStatusValue;

const FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "available", label: "Disponibles" },
  { value: "reserved", label: "Reservados" },
  { value: "adopted", label: "Adoptados" },
  { value: "hidden", label: "Ocultos" },
];

export default function PanelPerrosPage() {
  const router = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const loadDogs = useCallback(async (filter: StatusFilter) => {
    const q = filter ? `?status=${filter}` : "";
    const list = (await apiFetch(`/api/dogs${q}`)) as Dog[];
    setDogs(list);
  }, []);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/panel/login");
      return;
    }
    const p = parseJwt(t);
    setIsAdmin(p?.role === "admin");
    loadDogs(statusFilter).catch((e) => setErr(String(e.message)));
  }, [router, statusFilter, loadDogs]);

  const changeStatus = async (dogId: number, status: DogStatusValue) => {
    setSavingId(dogId);
    setErr(null);
    try {
      await apiFetch(`/api/dogs/${dogId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadDogs(statusFilter);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo actualizar el estado");
    } finally {
      setSavingId(null);
    }
  };

  const publishedCount = dogs.filter((d) => isDogPublished(d.status)).length;

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 920 }}>
      <p>
        <Link href="/panel/dashboard">← Dashboard</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>{isAdmin ? "Todos los perros" : "Mis perros"}</h1>
      {isAdmin ? (
        <p style={{ color: "var(--muted)", marginTop: 0 }}>
          Como admin ves perros de todos los refugios. Gestiona refugios en{" "}
          <Link href="/panel/refugios">Refugios</Link>.
        </p>
      ) : null}

      <div className={styles.helpBox}>
        <strong>Publicación en la web:</strong> solo los perros con estado{" "}
        <strong>Disponible</strong> aparecen en el listado público y en el buscador. Marca{" "}
        <strong>Adoptado</strong>, <strong>Reservado</strong> u <strong>Oculto</strong> cuando ya no deban mostrarse.
      </div>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/panel/perros/nuevo" className="btn btn-primary" style={{ display: "inline-block" }}>
          Nuevo perro
        </Link>
        <Link href="/panel/perros/importar" className="btn btn-secondary" style={{ display: "inline-block" }}>
          Importar ZIP
        </Link>
      </div>

      <div className={styles.filters} role="tablist" aria-label="Filtrar por estado">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value || "all"}
            type="button"
            role="tab"
            aria-selected={statusFilter === opt.value}
            className={`${styles.filterBtn}${statusFilter === opt.value ? ` ${styles.filterBtnActive}` : ""}`}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {dogs.length > 0 ? (
        <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          {dogs.length} perro{dogs.length === 1 ? "" : "s"}
          {statusFilter === "" ? (
            <>
              {" "}
              · <strong>{publishedCount}</strong> publicado{publishedCount === 1 ? "" : "s"} en la web
            </>
          ) : null}
        </p>
      ) : null}

      {err ? <p className="notice">{err}</p> : null}

      <div className="stack" style={{ gap: "0.75rem" }}>
        {dogs.map((d) => {
          const published = isDogPublished(d.status);
          const statusOpt = DOG_STATUS_OPTIONS.find((o) => o.value === d.status);
          return (
            <article key={d.id} className={`card ${styles.row}`}>
              <div className={styles.rowMain}>
                <div className={styles.rowTitle}>
                  <strong>{d.name}</strong>
                  <span className={dogStatusTagClass(d.status)}>{dogStatusLabel(d.status)}</span>
                  <span
                    className={`${styles.publishBadge} ${published ? styles.publishYes : styles.publishNo}`}
                    title={published ? "Visible en friendinme" : "No aparece en el listado público"}
                  >
                    {published ? "● Publicado" : "○ No publicado"}
                  </span>
                  <span
                    className={`tag tag--photos${(d.photo_count ?? 0) === 0 ? " tag--photos-empty" : ""}`}
                    title={
                      (d.photo_count ?? 0) === 0
                        ? "Sin fotos válidas en este registro"
                        : `${d.photo_count} foto(s) en disco`
                    }
                  >
                    {(d.photo_count ?? 0) === 0
                      ? "Sin fotos"
                      : d.photo_count === 1
                        ? "1 foto"
                        : `${d.photo_count} fotos`}
                  </span>
                </div>
                <p className={styles.meta}>
                  {d.city}, {d.province}
                  {isAdmin && d.shelter_id ? (
                    <>
                      {" · "}
                      <Link href={`/panel/refugios/${d.shelter_id}`}>Refugio #{d.shelter_id}</Link>
                    </>
                  ) : null}
                </p>
              </div>

              <div className={styles.statusBlock}>
                <label htmlFor={`status-${d.id}`}>Estado de adopción</label>
                <select
                  id={`status-${d.id}`}
                  className={styles.statusSelect}
                  value={d.status}
                  disabled={savingId === d.id}
                  onChange={(e) => changeStatus(d.id, e.target.value as DogStatusValue)}
                >
                  {DOG_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {statusOpt ? <p className={styles.statusHint}>{statusOpt.hint}</p> : null}
                {savingId === d.id ? <p className={styles.saving}>Guardando…</p> : null}
              </div>

              <div className={styles.actions}>
                <Link
                  href={`/panel/perros/${d.id}`}
                  className="btn btn-primary"
                  style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                >
                  Editar
                </Link>
                {published ? (
                  <Link
                    href={`/perros/${d.id}`}
                    className="btn btn-secondary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver público
                  </Link>
                ) : (
                  <span
                    className="btn btn-secondary"
                    style={{
                      padding: "0.35rem 0.75rem",
                      fontSize: "0.85rem",
                      opacity: 0.55,
                      cursor: "not-allowed",
                    }}
                    title="Solo visible en la web si el estado es Disponible"
                  >
                    Ver público
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!err && dogs.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          {statusFilter
            ? `No hay perros con estado «${dogStatusLabel(statusFilter)}».`
            : "Aún no hay perros. Crea uno o importa un ZIP."}
        </p>
      ) : null}
    </div>
  );
}
