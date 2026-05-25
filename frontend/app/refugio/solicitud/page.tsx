"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

export default function RefugioSolicitudPage() {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    organization_name: "",
    contact_name: "",
    email: "",
    phone: "",
    province: "",
    city: "",
    address: "",
    website: "",
    description: "",
    message: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await apiFetch("/api/shelter-applications", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          website: form.website || null,
        }),
      });
      setOk(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  if (ok) {
    return (
      <div className="container" style={{ padding: "2rem 0", maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Solicitud enviada</h1>
        <p>Hemos recibido tu petición de alta. Te contactaremos por email cuando revisemos los datos.</p>
        <p>
          <Link href="/">Volver al inicio</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 640 }}>
      <h1 style={{ marginTop: 0 }}>Alta de refugio / protectora</h1>
      <p style={{ color: "var(--muted)" }}>
        Completa el formulario. Un administrador revisará la solicitud y, si procede, activará tu refugio en la plataforma.
      </p>
      <p style={{ fontSize: "0.95rem" }}>
        ¿Ya tienes cuenta? <Link href="/panel/login">Acceder al panel</Link>
      </p>
      <form className="card" style={{ padding: "1.5rem", marginTop: "1rem" }} onSubmit={submit}>
        <div className="field">
          <label>Nombre de la organización</label>
          <input value={form.organization_name} onChange={(e) => set("organization_name", e.target.value)} required />
        </div>
        <div className="field">
          <label>Persona de contacto</label>
          <input value={form.contact_name} onChange={(e) => set("contact_name", e.target.value)} required />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="field">
          <label>Teléfono</label>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
        </div>
        <div className="field">
          <label>Provincia</label>
          <input value={form.province} onChange={(e) => set("province", e.target.value)} required />
        </div>
        <div className="field">
          <label>Ciudad</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} required />
        </div>
        <div className="field">
          <label>Dirección (opcional)</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="field">
          <label>Web (opcional)</label>
          <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Descripción del refugio</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} />
        </div>
        <div className="field">
          <label>Mensaje para el equipo FriendInMe</label>
          <textarea value={form.message} onChange={(e) => set("message", e.target.value)} rows={3} />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Enviando…" : "Enviar solicitud"}
        </button>
      </form>
      <p style={{ marginTop: "1rem" }}>
        <Link href="/">← Volver al inicio</Link>
      </p>
    </div>
  );
}
