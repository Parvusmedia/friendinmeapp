"use client";

import { Suspense } from "react";
import Link from "next/link";
import { DogPhotoThumb } from "@/components/DogPhoto";
import { MatchBreakdown } from "@/components/MatchBreakdown";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredAdopterEmail, getStoredAdopterId } from "@/lib/adopter-session";
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

type Dog = { id: number; name: string; main_image_url: string | null; province: string; city: string };

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

  useEffect(() => {
    if (token && !adopterId) {
      apiFetch(`/api/adopters/verify-results-token?token=${encodeURIComponent(token)}`)
        .then((v) => {
          const data = v as { valid: boolean; adopter_profile_id: number | null };
          if (data.valid && data.adopter_profile_id) {
            const q = new URLSearchParams({ adopter: String(data.adopter_profile_id) });
            if (highlightDogId) q.set("dog", highlightDogId);
            router.replace(`/resultados?${q.toString()}`);
          } else {
            setErr("El enlace ha caducado o no es válido. Solicita uno nuevo desde el cuestionario.");
          }
        })
        .catch(() => setErr("No se pudo validar el enlace."));
      return;
    }

    if (!adopterId) {
      const stored = getStoredAdopterId();
      if (stored) {
        const q = new URLSearchParams({ adopter: String(stored) });
        if (highlightDogId) q.set("dog", highlightDogId);
        router.replace(`/resultados?${q.toString()}`);
        return;
      }
      setErr("Falta el identificador del cuestionario. Vuelve a completarlo.");
      return;
    }

    const loadRows = async (results: MatchRow[]) => {
      let sorted = [...results].sort((a, b) => b.compatibility_score - a.compatibility_score);
      if (highlightDogId) {
        const hid = Number(highlightDogId);
        sorted = [...sorted].sort((a, b) => {
          if (a.dog_id === hid) return -1;
          if (b.dog_id === hid) return 1;
          return b.compatibility_score - a.compatibility_score;
        });
      }
      setRows(sorted);
      const pairs = await Promise.all(
        sorted.map((r) => apiFetch(`/api/dogs/${r.dog_id}`).then((d) => [r.dog_id, d as Dog] as const))
      );
      const m: Record<number, Dog> = {};
      pairs.forEach(([id, d]) => {
        m[id] = d;
      });
      setDogs(m);
    };

    const raw = sessionStorage.getItem("fi_last_match");
    if (raw) {
      try {
        const data = JSON.parse(raw) as { results: MatchRow[] };
        loadRows(data.results).catch(() => setErr("No se pudieron leer los resultados."));
        return;
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
        if (!list.length) {
          setErr("No hay resultados guardados. Completa el cuestionario de nuevo.");
          return;
        }
        return loadRows(
          list.map((r) => ({
            dog_id: r.dog_id,
            compatibility_score: r.compatibility_score,
            match_level: r.match_level,
            reasons: r.reasons,
            warnings: r.warnings,
            ai_explanation: r.ai_explanation,
            breakdown: [],
          }))
        );
      })
      .catch(() => setErr("No hay resultados. Repite el cuestionario."));
  }, [adopterId, highlightDogId, router, token]);

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
      })) as { results: MatchRow[] };
      sessionStorage.setItem("fi_last_match", JSON.stringify(match));
      const sorted = [...match.results].sort((a, b) => b.compatibility_score - a.compatibility_score);
      setRows(sorted);
      const pairs = await Promise.all(
        sorted.map((r) => apiFetch(`/api/dogs/${r.dog_id}`).then((d) => [r.dog_id, d as Dog] as const))
      );
      const m: Record<number, Dog> = {};
      pairs.forEach(([id, d]) => {
        m[id] = d;
      });
      setDogs(m);
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

  const title = highlightDogId && rows.length === 1 ? "Compatibilidad con este perro" : "Tus mejores matches";

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
      <h1 style={{ marginTop: 0 }}>{title}</h1>
      <p style={{ color: "var(--muted)" }}>
        {highlightDogId && rows.length === 1
          ? "Resultado orientativo para el perro que estabas viendo."
          : "Hasta 5 perros ordenados por compatibilidad (0–100)."}{" "}
        <strong>No es una garantía</strong>: habla con el refugio y visita al animal.
      </p>
      {matchMeta?.filters_applied ? (
        <p style={{ color: "var(--muted)", fontSize: "0.92rem" }}>
          Analizamos <strong>{matchMeta.candidates_count}</strong> perro
          {matchMeta.candidates_count === 1 ? "" : "s"} con tus criterios ({matchMeta.filters_applied}).
        </p>
      ) : null}
      <div className="notice" style={{ marginBottom: "1rem" }}>
        La puntuación resume encaje según la información disponible.
      </div>
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
      {emailMsg ? <p className="notice" style={{ marginTop: 0 }}>{emailMsg}</p> : null}
      <div className="stack" style={{ gap: "1.25rem" }}>
        {rows.map((r) => {
          const d = dogs[r.dog_id];
          const highlighted = highlightDogId && String(r.dog_id) === highlightDogId;
          return (
            <article
              key={r.dog_id}
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr)",
                overflow: "hidden",
                outline: highlighted ? "2px solid var(--accent)" : undefined,
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", padding: "1rem" }}>
                <div style={{ width: 160, flexShrink: 0, borderRadius: 12, overflow: "hidden" }}>
                  <DogPhotoThumb
                    src={d?.main_image_url}
                    alt={d?.name ? `Foto de ${d.name}` : "Perro"}
                    height={140}
                    href={`/perros/${r.dog_id}`}
                  />
                </div>
                <div style={{ flex: "1 1 200px" }}>
                  {highlighted ? (
                    <span className="tag" style={{ marginBottom: "0.35rem", display: "inline-block" }}>
                      Perro consultado
                    </span>
                  ) : null}
                  <h2 style={{ margin: "0 0 0.25rem" }}>{d?.name || `Perro #${r.dog_id}`}</h2>
                  <p style={{ margin: 0, color: "var(--muted)" }}>
                    {d ? `${d.city}, ${d.province}` : ""} · Score: <strong>{r.compatibility_score}</strong> · Nivel:{" "}
                    {r.match_level}
                  </p>
                  <p style={{ marginTop: "0.5rem" }}>{r.ai_explanation}</p>
                  <p style={{ fontSize: "0.9rem", color: "var(--accent)" }}>
                    <strong>Por qué encaja:</strong> {r.reasons.join(" ")}
                  </p>
                  {r.warnings.length ? (
                    <p style={{ fontSize: "0.9rem", color: "var(--warn)" }}>
                      <strong>Atención:</strong> {r.warnings.join(" ")}
                    </p>
                  ) : null}
                  {r.breakdown?.length ? <MatchBreakdown items={r.breakdown} /> : null}
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <Link href={`/perros/${r.dog_id}`} className="btn btn-secondary" style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}>
                      Ver ficha
                    </Link>
                    <Link
                      href={`/contacto?dog=${r.dog_id}&adopter=${adopterId}&score=${r.compatibility_score}`}
                      className="btn btn-primary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.9rem" }}
                    >
                      Contactar
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
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
