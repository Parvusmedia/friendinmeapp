"use client";

import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { checkLeadForDog, type AdopterLead } from "@/lib/adopter-leads";
import { apiFetch } from "@/lib/api";
import {
  type AdopterProfile,
  fetchAdopterById,
  persistAdopterSession,
  resolveStoredAdopter,
  runMatchForDog,
} from "@/lib/adopter-session";
import { cancelAdopterLead } from "@/lib/adopter-leads";
import {
  canAdopterCancel,
  leadStatusLabel,
  leadStatusShort,
  leadStatusTagClass,
} from "@/lib/lead-status";
import { resolveMediaUrl } from "@/lib/media-url";
import { whatsappUrl } from "@/lib/whatsapp";
import styles from "./contacto.module.css";

type DogSummary = {
  name: string;
  city: string;
  province: string;
  breed: string;
  main_image_url: string | null;
  shelter_whatsapp?: string;
};

function ContactoInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const dogIdParam = sp.get("dog");
  const adopterParam = sp.get("adopter");
  const scoreParam = sp.get("score");

  const [phase, setPhase] = useState<"loading" | "form" | "done" | "existing">("loading");
  const [profile, setProfile] = useState<AdopterProfile | null>(null);
  const [dogId, setDogId] = useState<number | null>(null);
  const [dog, setDog] = useState<DogSummary | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [existingLead, setExistingLead] = useState<AdopterLead | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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
        const d = (await apiFetch(`/api/dogs/${dogNum}`)) as DogSummary & { age_estimate?: string };
        setDog({
          name: d.name,
          city: d.city || "",
          province: d.province || "",
          breed: d.breed || "",
          main_image_url: d.main_image_url,
          shelter_whatsapp: d.shelter_whatsapp,
        });
      } catch {
        setDog({ name: `Perro #${dogNum}`, city: "", province: "", breed: "", main_image_url: null });
      }

      try {
        const check = await checkLeadForDog(adopter.id, adopter.email, dogNum);
        if (check.exists && check.lead) {
          setExistingLead(check.lead);
          setPhase("existing");
          return;
        }
      } catch {
        /* seguir al formulario */
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
      const msg = e2 instanceof Error ? e2.message : "Error al enviar";
      if (msg.includes("solicitud activa") || msg.includes("409")) {
        try {
          const check = await checkLeadForDog(profile.id, profile.email, dogId);
          if (check.lead) {
            setExistingLead(check.lead);
            setPhase("existing");
            return;
          }
        } catch {
          /* ignore */
        }
      }
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const cancelExisting = async () => {
    if (!profile || !existingLead) return;
    if (!confirm(`¿Cancelar tu solicitud para ${existingLead.dog_name}? Podrás enviar una nueva después.`)) return;
    setCancelling(true);
    setErr(null);
    try {
      await cancelAdopterLead(existingLead.id, profile.id, profile.email);
      setExistingLead(null);
      setPhase("form");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo cancelar");
    } finally {
      setCancelling(false);
    }
  };

  const dogName = dog?.name || existingLead?.dog_name || (dogId ? `Perro #${dogId}` : "");
  const messagePlaceholder = dogName
    ? `Cuéntales por qué te interesa a ${dogName}, tu disponibilidad para visita, etc.`
    : "Cuéntales por qué te interesa este perro, tu disponibilidad para visita, etc.";

  if (phase === "loading") {
    return (
      <div className={`container ${styles.page}`}>
        <p style={{ color: "var(--muted)" }}>Preparando tu solicitud…</p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className={`container ${styles.page}`}>
        <h1>Solicitud enviada</h1>
        <p>
          El refugio recibirá tus datos para contactarte sobre{" "}
          <strong>{dogName}</strong>. Gracias por dar un paso responsable hacia la adopción.
        </p>
        {dogId ? (
          <p style={{ marginTop: "0.75rem" }}>
            <Link href={`/perros/${dogId}`}>Volver a la ficha de {dogName}</Link>
          </p>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
          <Link href="/mis-solicitudes" className="btn btn-primary">
            Mis solicitudes
          </Link>
          <Link href="/perros" className="btn btn-secondary">
            Ver más perros
          </Link>
          <Link href={`/resultados?adopter=${profile?.id}`} className="btn btn-secondary">
            Mis matches
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "existing" && existingLead && profile) {
    return (
      <div className={`container ${styles.page}`}>
        <h1 style={{ marginTop: 0 }}>Solicitud ya enviada</h1>
        <p className={styles.lead}>
          Ya tienes una solicitud activa para <strong>{existingLead.dog_name}</strong>. No hace falta enviarla de
          nuevo; el refugio la tiene en su bandeja.
        </p>

        <div className={styles.dogCard} role="region" aria-label="Solicitud existente">
          <div className={styles.dogPhoto}>
            {existingLead.dog_main_image_url ? (
              <Image
                src={resolveMediaUrl(existingLead.dog_main_image_url)}
                alt=""
                fill
                className={styles.dogPhotoImg}
                sizes="72px"
                unoptimized
              />
            ) : (
              <div className={styles.dogPhotoEmpty} aria-hidden />
            )}
          </div>
          <div className={styles.dogCardBody}>
            <p className={styles.dogCardLabel}>Tu solicitud</p>
            <p className={styles.dogCardName}>{existingLead.dog_name}</p>
            <p className={styles.dogCardMeta}>{existingLead.shelter_name}</p>
            <p style={{ margin: "0.5rem 0 0" }}>
              <span className={leadStatusTagClass(existingLead.status)}>{leadStatusShort(existingLead.status)}</span>
            </p>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.88rem", color: "var(--muted)" }}>
              {leadStatusLabel(existingLead.status)}
            </p>
            {existingLead.message ? (
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem" }}>{existingLead.message}</p>
            ) : null}
          </div>
        </div>

        {err ? <p className="notice">{err}</p> : null}

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
          <Link href="/mis-solicitudes" className="btn btn-primary">
            Ver todas mis solicitudes
          </Link>
          <Link href={`/perros/${existingLead.dog_id}`} className="btn btn-secondary">
            Ver ficha del perro
          </Link>
          {canAdopterCancel(existingLead.status) ? (
            <button type="button" className="btn btn-secondary" disabled={cancelling} onClick={cancelExisting}>
              {cancelling ? "Cancelando…" : "Cancelar solicitud"}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (!profile || !dogId) {
    return (
      <div className={`container ${styles.page}`}>
        <h1 style={{ marginTop: 0 }}>Contacto por adopción</h1>
        {err ? <p className="notice">{err}</p> : null}
        <Link href="/perros">Ver perros</Link>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <h1 style={{ marginTop: 0 }}>Solicitud de contacto</h1>
      <p className={styles.lead}>
        Estás enviando una solicitud para <strong>{dogName}</strong>. Usamos el perfil que ya completaste; solo
        añade un mensaje opcional para el refugio.
        {score !== null ? (
          <>
            {" "}
            Compatibilidad orientativa con {dogName}: <strong>{Math.round(score)}%</strong>.
          </>
        ) : null}
      </p>

      <div className={styles.dogCard} role="region" aria-label="Perro seleccionado">
        <div className={styles.dogPhoto}>
          {dog?.main_image_url ? (
            <Image
              src={resolveMediaUrl(dog.main_image_url)}
              alt=""
              fill
              className={styles.dogPhotoImg}
              sizes="72px"
              unoptimized
            />
          ) : (
            <div className={styles.dogPhotoEmpty} aria-hidden />
          )}
        </div>
        <div className={styles.dogCardBody}>
          <p className={styles.dogCardLabel}>Perro de tu solicitud</p>
          <p className={styles.dogCardName}>{dogName}</p>
          {dog?.city || dog?.province ? (
            <p className={styles.dogCardMeta}>
              📍 {[dog.city, dog.province].filter(Boolean).join(", ")}
              {dog.breed ? ` · ${dog.breed}` : ""}
            </p>
          ) : dog?.breed ? (
            <p className={styles.dogCardMeta}>{dog.breed}</p>
          ) : null}
          <Link href={`/perros/${dogId}`} className={styles.dogCardLink}>
            Ver ficha del perro
          </Link>
        </div>
      </div>

      <div className={`card ${styles.profileCard}`}>
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.85rem", color: "var(--muted)" }}>Tus datos (del cuestionario)</p>
        <p style={{ margin: 0 }}>
          <strong>{profile.name}</strong> · {profile.email} · {profile.phone}
        </p>
        <p style={{ margin: "0.35rem 0 0", color: "var(--muted)" }}>
          {profile.city}, {profile.province}
        </p>
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem" }}>
          <Link href={`/cuestionario?dog=${dogId}`}>Actualizar mi perfil</Link>
          {" · "}
          <Link href="/mis-solicitudes">Mis solicitudes</Link>
        </p>
      </div>

      <form className={`card ${styles.formCard}`} onSubmit={submit}>
        <div className={styles.readonlyField}>
          <label htmlFor="contacto-perro">Perro</label>
          <p id="contacto-perro">{dogName}</p>
        </div>
        <div className="field">
          <label htmlFor="contacto-mensaje">Mensaje para el refugio (opcional)</label>
          <textarea
            id="contacto-mensaje"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messagePlaceholder}
            rows={5}
          />
        </div>
        {err ? <p className="notice">{err}</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Enviar solicitud"}
          </button>
          {dog?.shelter_whatsapp && dogName ? (
            <a
              href={
                whatsappUrl(
                  dog.shelter_whatsapp,
                  `Hola, soy ${profile.name}. Me interesa adoptar a ${dogName} (FriendInMe). ${message ? message.slice(0, 200) : ""}`
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
