"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { hasValidSession, parseJwt, setToken } from "@/lib/auth";

export default function PanelLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (hasValidSession()) {
      router.replace("/panel/dashboard");
      return;
    }
    setChecking(false);
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = (await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })) as { access_token: string };
      setToken(res.access_token);
      const p = parseJwt(res.access_token);
      if (p?.role === "admin" || p?.role === "shelter") router.push("/panel/dashboard");
      else router.push("/");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error");
    }
  };

  if (checking) {
    return (
      <div className="container" style={{ padding: "3rem 0", maxWidth: 420 }}>
        <p style={{ color: "var(--muted)" }}>Comprobando sesión…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "3rem 0", maxWidth: 420 }}>
      <h1 style={{ marginTop: 0 }}>Acceso refugios / admin</h1>
      <form className="card" style={{ padding: "1.5rem" }} onSubmit={submit}>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <button className="btn btn-primary" type="submit">
          Entrar
        </button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.95rem" }}>
        ¿Refugio nuevo? <Link href="/refugio/solicitud">Solicitar alta</Link>
        <br />
        <Link href="/">← Volver al inicio</Link>
      </p>
    </div>
  );
}
