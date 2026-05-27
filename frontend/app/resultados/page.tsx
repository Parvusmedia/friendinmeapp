"use client";

import { Suspense } from "react";
import Link from "next/link";
import { CompatResultDetail } from "@/components/CompatResultDetail";
import { CompatRing } from "@/components/CompatRing";
import { DogPhotoThumb } from "@/components/DogPhoto";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredAdopterEmail, getStoredAdopterId } from "@/lib/adopter-session";
import { matchLevelLabel } from "@/lib/match-labels";
import styles from "./resultados.module.css";

type BreakdownItem = { key: string; label: string; percent: number; status: string };

type MatchRow = {
  dog_id: number;
  compatibility_score: number;
  match_level: string;
  reasons: string[];
  warnings: string[];
  ai_explanation: string | null;
  breakdown?: BreakdownItem[];
};

type Dog = {
  id: number;
  name: string;
  main_image_url: string | null;
  province: string;
  city: string;
  breed?: string;
  size?: string;
  energy_level?: string;
  age_estimate?: string;
};

async function enrichRow(adopterId: string, row: MatchRow): Promise<MatchRow> {
  if (row.breakdown?.length) return row;
  try {
    const preview = (await apiFetch(
      `/api/matches/preview?adopter_profile_id=${adopterId}&dog_id=${row.dog_id}`
    )) as MatchRow;
    return {
      ...row,
      breakdown: preview.breakdown ?? [],
      reasons: row.reasons.length ? row.reasons : preview.reasons,
      warnings: row.warnings.length ? row.warnings : preview.warnings,
      match_level: row.match_level || preview.match_level,
    };
  } catch {
    return row;
  }
}

function ResultadosInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const adopterId = sp.get("adopter");
  const highlightDogId = sp.get("dog");
  const token = sp.get("token");
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [dogs, setDogs] = useState<Record<number, Dog>>({});
  const [err, setErr] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [shareOk, setShareOk] = useState(false);
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matchMeta, setMatchMeta] = useState<{ candidates_count: number; filters_applied: string } | null>(
    null
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("fi_last_match_meta");
      if (raw) setMatchMeta(JSON.parse(raw) as { candidates_count: number; filters_applied: string });
    } catch {
      /* ignore */
    }
  }, []);

  const loadDogsAndRows = useCallback(
    async (results: MatchRow[], aid: string): Promise<boolean> => {
      if (!results.length) return false;
      let sorted = [...results].sort((a, b) => b.compatibility_score - a.compatibility_score);
      if (highlightDogId) {
        const hid = Number(highlightDogId);
        sorted = [...sorted].sort((a, b) => {
          if (a.dog_id === hid) return -1;
          if (b.dog_id === hid) return 1;
          return b.compatibility_score - a.compatibility_score;
        });
      }
      const enriched = await Promise.all(sorted.map((r) => enrichRow(aid, r)));
      setRows(enriched);
      const pairs = await Promise.all(
        enriched.map((r) => apiFetch(`/api/dogs/${r.dog_id}`).then((d) => [r.dog_id, d as Dog] as const))
      );
      const m: Record<number, Dog> = {};
      pairs.forEach(([id, d]) => {
        m[id] = d;
      });
      setDogs(m);
      return true;
    },
    [highlightDogId]
  );

  useEffect(() => {
    let cancelled = false;

    const finish = (hasRows: boolean) => {
      if (!cancelled) setLoading(false);
      if (!cancelled && !hasRows) setRows([]);
    };

    const applyResults = async (results: MatchRow[], aid: string) => {
      const ok = await loadDogsAndRows(results, aid);
      finish(ok);
    };

    if (token && !adopterId) {
      setLoading(true);
      apiFetch(`/api/adopters/verify-results-token?token=${encodeURIComponent(token)}`)
        .then((v) => {
          const data = v as { valid: boolean; adopter_profile_id: number | null };
          if (data.valid && data.adopter_profile_id) {
            const q = new URLSearchParams({ adopter: String(data.adopter_profile_id) });
            if (highlightDogId) q.set("dog", highlightDogId);
            router.replace(`/resultados?${q.toString()}`);
          } else {
            setErr("El enlace ha caducado o no es válido. Solicita uno nuevo desde el cuestionario.");
            finish(false);
          }
        })
        .catch(() => {
          setErr("No se pudo validar el enlace.");
          finish(false);
        });
      return () => {
        cancelled = true;
      };
    }

    if (!adopterId) {
      const stored = getStoredAdopterId();
      if (stored) {
        const q = new URLSearchParams({ adopter: String(stored) });
        if (highlightDogId) q.set("dog", highlightDogId);
        router.replace(`/resultados?${q.toString()}`);
        return () => {
          cancelled = true;
        };
      }
      setErr("Falta el identificador del cuestionario. Vuelve a completarlo.");
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setErr(null);

    const raw = sessionStorage.getItem("fi_last_match");
    if (raw) {
      try {
        const data = JSON.parse(raw) as { results?: MatchRow[] };
        void applyResults(data.results ?? [], adopterId).catch(() => {
          if (!cancelled) setErr("No se pudieron leer los resultados.");
          finish(false);
        });
        return () => {
          cancelled = true;
        };
      } catch {
        /* fallback API */
      }
    }

    apiFetch(`/api/matches/${adopterId}`)
      .then((stored) => {
        const list = stored as {
          dog_id: number;
          compatibility_score: number;
          match_level: string;
          reasons: string[];
          warnings: string[];
          ai_explanation: string | null;
        }[];
        return applyResults(
          list.map((r) => ({
            dog_id: r.dog_id,
            compatibility_score: r.compatibility_score,
            match_level: r.match_level,
            reasons: r.reasons,
            warnings: r.warnings,
            ai_explanation: r.ai_explanation,
            breakdown: [],
          })),
          adopterId
        );
      })
      .catch(() => {
        if (!cancelled) setErr("No hay resultados. Repite el cuestionario.");
        finish(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adopterId, highlightDogId, router, token, loadDogsAndRows]);

  const recalculate = async () => {
    if (!adopterId) return;
    setRecalculating(true);
    setErr(null);
    try {
      const body: Record<string, unknown> = {
        adopter_profile_id: Number(adopterId),
        top_n: highlightDogId ? 1 : 5,
        use_ai: true,
      };
      if (highlightDogId) body.dog_id = Number(highlightDogId);
      const match = (await apiFetch("/api/matches", {
        method: "POST",
        body: JSON.stringify(body),
      })) as {
        results: MatchRow[];
        candidates_count?: number;
        filters_applied?: string | null;
      };
      sessionStorage.setItem("fi_last_match", JSON.stringify(match));
      sessionStorage.setItem(
        "fi_last_match_meta",
        JSON.stringify({
          candidates_count: match.candidates_count ?? 0,
          filters_applied: match.filters_applied ?? "",
        })
      );
      setLoading(true);
      const ok = await loadDogsAndRows(match.results, adopterId);
      setLoading(false);
      if (!ok) setRows([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al recalcular");
    } finally {
      setRecalculating(false);
    }
  };

  const copyShareLink = async () => {
    if (!adopterId || typeof window === "undefined") return;
    const url = `${window.location.origin}/resultados?adopter=${adopterId}${highlightDogId ? `&dog=${highlightDogId}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareOk(true);
      setTimeout(() => setShareOk(false), 2500);
    } catch {
      setShareOk(false);
    }
  };

  const resendEmail = async () => {
    const email = getStoredAdopterEmail();
    if (!email) {
      setEmailMsg("No tenemos tu email guardado en este dispositivo.");
      return;
    }
    setEmailBusy(true);
    setEmailMsg(null);
    try {
      const res = (await apiFetch("/api/adopters/send-results-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      })) as { sent: boolean; message: string };
      setEmailMsg(res.message);
    } catch (e) {
      setEmailMsg(e instanceof Error ? e.message : "Error al enviar");
    } finally {
      setEmailBusy(false);
    }
  };

  if (err) {
    return (
      <div className="container" style={{ padding: "2rem" }}>
        <p className="notice">{err}</p>
        <Link href="/cuestionario">Ir al cuestionario</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`container ${styles.page}`}>
        <p style={{ color: "var(--muted)" }}>Cargando resultados…</p>
      </div>
    );
  }

  if (!rows.length) {
    const filtersNote = matchMeta?.filters_applied?.trim();
    return (
      <div className={`container ${styles.page}`}>
        <h1 style={{ marginTop: 0 }}>Sin matches por ahora</h1>
        <div className={styles.emptyBox}>
          <p>
            No hay perros publicados que cumplan <strong>todos</strong> los filtros de tu cuestionario al mismo tiempo.
            {typeof matchMeta?.candidates_count === "number" ? (
              <>
                {" "}
                Analizamos <strong>{matchMeta.candidates_count}</strong> candidato
                {matchMeta.candidates_count === 1 ? "" : "s"} con esos criterios.
              </>
            ) : null}
          </p>
          {filtersNote ? (
            <p className={styles.emptyFilters}>
              <strong>Filtros activos:</strong> {filtersNote}
            </p>
          ) : null}
          <p style={{ color: "var(--muted)", marginBottom: 0 }}>
            Prueba a ampliar provincia, energía o razas en el cuestionario, o explora el catálogo completo.
          </p>
        </div>
        <div className={styles.toolbar}>
          <Link href="/cuestionario" className="btn btn-primary">
            Editar cuestionario
          </Link>
          <Link href="/perros" className="btn btn-secondary">
            Ver todos los perros
          </Link>
          <button type="button" className="btn btn-secondary" onClick={recalculate} disabled={recalculating}>
            {recalculating ? "Recalculando…" : "Volver a calcular"}
          </button>
        </div>
      </div>
    );
  }

  const primaryId = highlightDogId ? Number(highlightDogId) : rows.length === 1 ? rows[0].dog_id : null;
  const primaryRow = primaryId ? rows.find((r) => r.dog_id === primaryId) ?? rows[0] : null;
  const otherRows = primaryRow ? rows.filter((r) => r.dog_id !== primaryRow.dog_id) : rows;
  const showDetail = Boolean(primaryRow && adopterId);
  const listOnly = !showDetail;

  const title = showDetail && primaryRow
    ? `Compatibilidad con ${dogs[primaryRow.dog_id]?.name || "este perro"}`
    : "Tus mejores matches";

  return (
    <div className={`container ${styles.page}`}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      {!showDetail ? (
        <p className={styles.lead}>
          Hasta 5 perros ordenados por compatibilidad (0–100). <strong>No es una garantía</strong>: habla con el
          refugio y visita al animal.
        </p>
      ) : null}
      {matchMeta?.filters_applied ? (
        <p className={styles.lead} style={{ fontSize: "0.92rem" }}>
          Analizamos <strong>{matchMeta.candidates_count}</strong> perro
          {matchMeta.candidates_count === 1 ? "" : "s"} con tus criterios ({matchMeta.filters_applied}).
        </p>
      ) : null}

      <div className={styles.toolbar}>
        <button type="button" className="btn btn-secondary" onClick={recalculate} disabled={recalculating}>
          {recalculating ? "Recalculando…" : "Actualizar compatibilidad"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={copyShareLink}>
          Copiar enlace
        </button>
        <button type="button" className="btn btn-secondary" onClick={resendEmail} disabled={emailBusy}>
          {emailBusy ? "Enviando…" : "Enviar enlace por email"}
        </button>
      </div>
      {shareOk ? <p className={styles.shareOk}>Enlace copiado al portapapeles.</p> : null}
      {emailMsg ? (
        <p className="notice" style={{ marginTop: 0 }}>
          {emailMsg}
        </p>
      ) : null}

      {showDetail && primaryRow && adopterId ? (
        <CompatResultDetail
          dog={{
            id: primaryRow.dog_id,
            name: dogs[primaryRow.dog_id]?.name || `Perro #${primaryRow.dog_id}`,
            city: dogs[primaryRow.dog_id]?.city || "",
            province: dogs[primaryRow.dog_id]?.province || "",
            main_image_url: dogs[primaryRow.dog_id]?.main_image_url ?? null,
            breed: dogs[primaryRow.dog_id]?.breed,
            size: dogs[primaryRow.dog_id]?.size,
            energy_level: dogs[primaryRow.dog_id]?.energy_level,
            age_estimate: dogs[primaryRow.dog_id]?.age_estimate,
          }}
          score={primaryRow.compatibility_score}
          matchLevel={primaryRow.match_level}
          reasons={primaryRow.reasons}
          warnings={primaryRow.warnings}
          aiExplanation={primaryRow.ai_explanation}
          breakdown={primaryRow.breakdown ?? []}
          adopterId={adopterId}
        />
      ) : null}

      {listOnly ? (
        <div className={styles.compactList}>
          {rows.map((r) => {
            const d = dogs[r.dog_id];
            return (
              <article key={r.dog_id} className={styles.compactCard}>
                <div style={{ width: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
                  <DogPhotoThumb
                    src={d?.main_image_url}
                    alt={d?.name ? `Foto de ${d.name}` : "Perro"}
                    height={72}
                    href={`/perros/${r.dog_id}`}
                  />
                </div>
                <CompatRing pct={r.compatibility_score} size="sm" />
                <div className={styles.compactCardMain}>
                  <h3>{d?.name || `Perro #${r.dog_id}`}</h3>
                  <p>
                    {d ? `${d.city}, ${d.province}` : ""} · {matchLevelLabel(r.match_level)}
                  </p>
                </div>
                <div className={styles.compactActions}>
                  <Link
                    href={`/resultados?adopter=${adopterId}&dog=${r.dog_id}`}
                    className="btn btn-primary"
                    style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}
                  >
                    Ver análisis
                  </Link>
                  <Link
                    href={`/contacto?dog=${r.dog_id}&adopter=${adopterId}&score=${Math.round(r.compatibility_score)}`}
                    className="btn btn-secondary"
                    style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}
                  >
                    Contactar
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {showDetail && otherRows.length > 0 && adopterId ? (
        <section className={styles.otherMatches} aria-labelledby="otros-matches">
          <h2 id="otros-matches">Otros perros compatibles</h2>
          <div className={styles.compactList}>
            {otherRows.map((r) => {
              const d = dogs[r.dog_id];
              return (
                <article key={r.dog_id} className={styles.compactCard}>
                  <div style={{ width: 72, flexShrink: 0, borderRadius: 10, overflow: "hidden" }}>
                    <DogPhotoThumb
                      src={d?.main_image_url}
                      alt={d?.name ? `Foto de ${d.name}` : "Perro"}
                      height={72}
                      href={`/perros/${r.dog_id}`}
                    />
                  </div>
                  <CompatRing pct={r.compatibility_score} size="sm" />
                  <div className={styles.compactCardMain}>
                    <h3>{d?.name || `Perro #${r.dog_id}`}</h3>
                    <p>
                      {d ? `${d.city}, ${d.province}` : ""} · {matchLevelLabel(r.match_level)}
                    </p>
                  </div>
                  <div className={styles.compactActions}>
                    <Link
                      href={`/resultados?adopter=${adopterId}&dog=${r.dog_id}`}
                      className="btn btn-secondary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}
                    >
                      Ver análisis
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function ResultadosPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "2rem" }}>Cargando…</div>}>
      <ResultadosInner />
    </Suspense>
  );
}
