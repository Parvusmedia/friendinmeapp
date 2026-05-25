"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken, parseJwt } from "@/lib/auth";

type Dog = { id: number; name: string; status: string; province: string; city: string; shelter_id?: number };

export default function PanelPerrosPage() {
  const router = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const t = getToken();
    if (!t) {
      router.replace("/panel/login");
      return;
    }
    const p = parseJwt(t);
    setIsAdmin(p?.role === "admin");
    apiFetch("/api/dogs")
      .then((d) => setDogs(d as Dog[]))
      .catch((e) => setErr(String(e.message)));
  }, [router]);

  return (
    <div className="container" style={{ padding: "2rem 0" }}>
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
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <Link href="/panel/perros/nuevo" className="btn btn-primary" style={{ display: "inline-block" }}>
          Nuevo perro
        </Link>
        <Link href="/panel/perros/importar" className="btn btn-secondary" style={{ display: "inline-block" }}>
          Importar ZIP
        </Link>
      </div>
      {err ? <p className="notice">{err}</p> : null}
      <div className="stack" style={{ gap: "0.75rem" }}>
        {dogs.map((d) => (
          <div key={d.id} className="card" style={{ padding: "1rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <strong>{d.name}</strong> <span className="tag">{d.status}</span>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                {d.city}, {d.province}
                {isAdmin && d.shelter_id ? (
                  <>
                    {" · "}
                    <Link href={`/panel/refugios/${d.shelter_id}`}>Refugio #{d.shelter_id}</Link>
                  </>
                ) : null}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <Link
                href={`/panel/perros/${d.id}`}
                className="btn btn-primary"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
              >
                Editar
              </Link>
              <Link href={`/perros/${d.id}`} className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}>
                Ver público
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
                onClick={async () => {
                  await apiFetch(`/api/dogs/${d.id}/status`, {
                    method: "PATCH",
                    body: JSON.stringify({ status: "hidden" }),
                  });
                  const t = getToken();
                  if (t) {
                    const list = (await apiFetch("/api/dogs")) as Dog[];
                    setDogs(list);
                  }
                }}
              >
                Ocultar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
