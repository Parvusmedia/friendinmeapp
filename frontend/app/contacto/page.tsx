"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  type AdopterProfile,
  fetchAdopterById,
  persistAdopterSession,
  resolveStoredAdopter,
  runMatchForDog,
} from "@/lib/adopter-session";
import { whatsappUrl } from "@/lib/whatsapp";

function ContactoInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const dogIdParam = sp.get("dog");
  const adopterParam = sp.get("adopter");
  const scoreParam = sp.get("score");

  const [phase, setPhase] = useState<"loading" | "form" | "done">("loading");
  const [profile, setProfile] = useState<AdopterProfile | null>(null);
  const [dogId, setDogId] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [dogName, setDogName] = useState("");
  const [shelterWhatsapp, setShelterWhatsapp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!dogIdParam) {
        if (!cancelled) {
          setErr("Elige un perro desde su ficha o desde tus resultados de compatibilidad.");
          setPhase("form");
        }
        return;
      }

      const dogNum = Number(dogIdParam);
      if (!Number.isFinite(dogNum)) {
        if (!cancelled) {
          setErr("Perro no válido.");
          setPhase("form");
        }
        return;
      }

      let adopter: AdopterProfile | null = null;
      if (adopterParam) {
        adopter = await fetchAdopterById(Number(adopterParam));
      }
      if (!adopter) {
        adopter = await resolveStoredAdopter();
      }

      if (cancelled) return;

      if (!adopter) {
        router.replace(`/cuestionario?dog=${dogNum}`);
        return;
      }

      persistAdopterSession(adopter.id, adopter.email);
      setProfile(adopter);
      setDogId(dogNum);

      try {
        const dog = (await apiFetch(`/api/dogs/${dogNum}`)) as {
          name: string;
          shelter_whatsapp?: string;
        };
        setDogName(dog.name);
        setShelterWhatsapp(dog.shelter_whatsapp || "");
      } catch {
        setDogName("");
        setShelterWhatsapp("");
      }

      let compat = scoreParam ? Number(scoreParam) : NaN;
      if (!Number.isFinite(compat)) {
        try {
          const m = await runMatchForDog(adopter.id, dogNum);
          compat = m.compatibility_score;
        } catch {
          compat = 0;
        }
      }
      if (!cancelled) {
        setScore(compat);
        setPhase("form");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dogIdParam, adopterParam, scoreParam, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !dogId || score === null) {
      setErr("Faltan datos. Vuelve a intentarlo desde la ficha del perro.");
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      await apiFetch("/api/leads", {
        method: "POST",
        body: JSON.stringify({
          adopter_profile_id: profile.id,
          dog_id: dogId,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          province: profile.province,
          message,
          compatibility_score: score,
        }),
      });
      setPhase("done");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Error al enviar");
    } finally {
      setLoading(false);
    }
  };

  if (phase === "loading") {
    return (
      <div className="container" style={{ padding: "2rem 0", maxWidth: 560 }}>
        <p style={{ color: "var(--muted)" }}>Preparando tu solicitud…</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="container" style={{ padding: "2rem 0", maxWidth: 560 }}>
        <h1>Solicitud enviada</h1>
        <p>El refugio recibirá tus datos. Gracias por dar un paso responsable hacia la adopción.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
          <Link href="/perros" className="btn btn-secondary">
            Ver más perros
          </Link>
          <Link href={`/resultados?adopter=${profile?.id}`} className="btn btn-primary">
            Mis matches
          </Link>
        </div>
      </div>
    );
  }

  if (!profile || !dogId) {
    return (
      <div className="container" style={{ padding: "2rem 0", maxWidth: 560 }}>
        <h1 style={{ marginTop: 0 }}>Contacto por adopción</h1>
        {err ? <p className="notice">{err}</p> : null}
        <Link href="/perros">Ver perros</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 0", maxWidth: 560 }}>
      <h1 style={{ marginTop: 0 }}>Solicitud de contacto</h1>
      <p style={{ color: "var(--muted)" }}>
        Usamos el perfil que ya completaste. Solo necesitas un mensaje para este perro.
        {score !== null ? (
          <>
            {" "}
            Compatibilidad orientativa: <strong>{score}</strong>
          </>
        ) : null}
      </p>

      <div className="card" style={{ padding: "1rem 1.25rem", marginBottom: "1rem", background: "#f8f9f8" }}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", color: "var(--muted)" }}>Tus datos (del cuestionario)</p>
        <p style={{ margin: 0 }}>
          <strong>{profile.name}</strong> · {profile.email} · {profile.phone}
        </p>
        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)" }}>
          {profile.city}, {profile.province}
        </p>
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem" }}>
          <Link href={`/cuestionario?dog=${dogId}`}>Actualizar mi perfil</Link>
        </p>
      </div>

      <form className="card" style={{ padding: "1.5rem" }} onSubmit={submit}>
        <div className="field">
          <label>Mensaje para el refugio (opcional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Cuéntales por qué te interesa este perro, tu disponibilidad para visita, etc."
            rows={5}
          />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Enviar solicitud"}
          </button>
          {shelterWhatsapp && dogName ? (
            <a
              href={
                whatsappUrl(
                  shelterWhatsapp,
                  `Hola, soy ${profile.name}. Me interesa ${dogName} (FriendInMe). ${message ? message.slice(0, 200) : ""}`
                ) || "#"
              }
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp al refugio
            </a>
          ) : null}
        </div>
      </form>
    </div>
  );
}

export default function ContactoPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "2rem" }}>Cargando…</div>}>
      <ContactoInner />
    </Suspense>
  );
}
