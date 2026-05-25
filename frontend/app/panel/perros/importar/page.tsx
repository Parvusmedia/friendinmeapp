"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";

type ImportRow = {
  row_number: number;
  name: string;
  fotos_zip: string;
  photo_count: number;
  ok: boolean;
  errors: string[];
  warnings?: string[];
};

type Preview = {
  job_id: string;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  rows: ImportRow[];
};

type JobStatus = {
  job_id: string;
  status: "preview" | "processing" | "completed" | "failed";
  total_rows: number;
  processed_rows: number;
  created_count: number;
  error_count: number;
  message: string | null;
  rows: ImportRow[];
};

export default function PanelPerrosImportarPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [shelterId, setShelterId] = useState("");
  const role = typeof window !== "undefined" ? parseJwt(getToken() || "")?.role : null;

  useEffect(() => {
    if (!getToken()) router.replace("/panel/login");
  }, [router]);

  const downloadTemplate = async () => {
    setErr(null);
    const token = getToken();
    const res = await fetch("/api/dogs/import/template", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("No se pudo descargar la plantilla");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "friendinme-import-plantilla.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pollJob = useCallback(async (jobId: string) => {
    const data = (await apiFetch(`/api/dogs/import/${jobId}`)) as JobStatus;
    setJobStatus(data);
    if (data.status === "processing") {
      setTimeout(() => pollJob(jobId), 1500);
    }
  }, []);

  const uploadPreview = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setErr("Selecciona un archivo ZIP");
      return;
    }
    setErr(null);
    setLoading(true);
    setPreview(null);
    setJobStatus(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      let url = "/api/dogs/import/preview";
      if (role === "admin" && shelterId.trim()) {
        url += `?shelter_id=${encodeURIComponent(shelterId.trim())}`;
      }
      const data = (await apiFetch(url, { method: "POST", body: fd })) as Preview;
      setPreview(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al analizar el ZIP");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!preview?.job_id) return;
    if (preview.valid_rows === 0) {
      setErr("No hay filas válidas para importar");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await apiFetch(`/api/dogs/import/${preview.job_id}/confirm`, { method: "POST" });
      await pollJob(preview.job_id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al confirmar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 900 }}>
      <p>
        <Link href="/panel/perros">← Perros</Link>
      </p>
      <h1 style={{ marginTop: 0 }}>Importar perros (ZIP)</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640 }}>
        Empaqueta <strong>perros.csv</strong> y la carpeta <strong>fotos/</strong> (un ZIP por perro con todas sus
        fotos). La columna <code>fotos_zip</code> debe coincidir con el nombre del archivo en{" "}
        <code>fotos/</code>.
      </p>

      <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        <button type="button" className="btn btn-secondary" onClick={() => downloadTemplate().catch((e) => setErr(String(e)))}>
          Descargar plantilla ZIP
        </button>
      </div>

      <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
        {role === "admin" ? (
          <div className="field">
            <label>ID refugio (obligatorio para admin)</label>
            <input type="number" value={shelterId} onChange={(e) => setShelterId(e.target.value)} placeholder="1" />
          </div>
        ) : null}
        <div className="field">
          <label>Archivo importacion.zip</label>
          <input ref={fileRef} type="file" accept=".zip,application/zip" />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="button" className="btn btn-primary" disabled={loading} onClick={uploadPreview}>
            {loading && !preview ? "Analizando…" : "Vista previa"}
          </button>
          {preview && preview.valid_rows > 0 ? (
            <button type="button" className="btn btn-primary" disabled={loading || jobStatus?.status === "processing"} onClick={confirmImport}>
              Confirmar importación ({preview.valid_rows} perros)
            </button>
          ) : null}
        </div>
      </div>

      {preview ? (
        <div className="card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <p>
            <strong>{preview.valid_rows}</strong> válidas / <strong>{preview.invalid_rows}</strong> con error ·{" "}
            {preview.total_rows} filas
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "0.5rem" }}>#</th>
                  <th style={{ padding: "0.5rem" }}>Nombre</th>
                  <th style={{ padding: "0.5rem" }}>fotos_zip</th>
                  <th style={{ padding: "0.5rem" }}>Fotos</th>
                  <th style={{ padding: "0.5rem" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.row_number} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.5rem" }}>{r.row_number}</td>
                    <td style={{ padding: "0.5rem" }}>{r.name}</td>
                    <td style={{ padding: "0.5rem" }}>{r.fotos_zip}</td>
                    <td style={{ padding: "0.5rem" }}>{r.photo_count}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {r.ok ? (
                        <span className="tag" style={{ background: "var(--accent-soft)" }}>
                          OK
                        </span>
                      ) : (
                        <span title={r.errors.join(", ")} className="tag">
                          Error
                        </span>
                      )}
                      {!r.ok && r.errors.length ? (
                        <div style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                          {r.errors.join(" · ")}
                        </div>
                      ) : null}
                      {r.warnings?.length ? (
                        <div style={{ color: "#9a6b00", fontSize: "0.8rem", marginTop: "0.25rem" }}>
                          {r.warnings.join(" · ")}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {jobStatus && jobStatus.status !== "preview" ? (
        <div className="card" style={{ padding: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Resultado</h2>
          <p>
            Estado: <strong>{jobStatus.status}</strong>
            {jobStatus.message ? ` — ${jobStatus.message}` : ""}
          </p>
          {jobStatus.status === "processing" ? (
            <p style={{ color: "var(--muted)" }}>
              Procesando {jobStatus.processed_rows} / {jobStatus.total_rows}…
            </p>
          ) : null}
          {jobStatus.status === "completed" ? (
            <p>
              Creados: <strong>{jobStatus.created_count}</strong> · Errores: <strong>{jobStatus.error_count}</strong>
            </p>
          ) : null}
          {jobStatus.status === "completed" ? (
            <Link href="/panel/perros" className="btn btn-secondary" style={{ display: "inline-block", marginTop: "0.5rem" }}>
              Ver listado de perros
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
