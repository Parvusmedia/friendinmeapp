"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  type AdopterProfile,
  clearAdopterSession,
  persistAdopterSession,
  resolveStoredAdopter,
} from "@/lib/adopter-session";
import { MultiCheckboxGroup } from "@/components/MultiCheckboxGroup";
import { BREED_OPTIONS } from "@/lib/breeds";
import { AGE_FILTER_OPTIONS, AGE_LABELS_SHORT } from "@/lib/dog-filters";
import {
  validateAllFormSteps,
  validateEmail,
  validateFormStep,
} from "@/lib/cuestionario-validation";
import {
  type ListingMatchFilters,
  filtersFromSearchParams,
  hasListingFilters,
  readListingFilters,
  saveListingFilters,
} from "@/lib/match-filters";
import {
  getQuestionnaireStep,
  getQuestionnaireTotalSteps,
  QuestionnaireIntro,
  StepHint,
  StepProgress,
} from "./QuestionnaireUi";
import styles from "./cuestionario.module.css";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  province: "",
  city: "",
  housing_type: "apartment",
  has_children: false,
  children_age_range: "",
  has_other_dogs: false,
  has_cats: false,
  previous_dog_experience: "none",
  hours_away_from_home: "0-2",
  activity_level: "medium",
  preferred_sizes: [] as string[],
  preferred_age_ranges: [] as string[],
  preferred_energy: "no_preference",
  adoption_reason: "",
  important_notes: "",
  province_preference: "",
  breed_preferences: [] as string[],
  max_distance_km: "" as string | number,
  consent_marketing: false,
  consent_contact: false,
};

const HOUSING_LABELS: Record<string, string> = {
  apartment: "Piso",
  house: "Casa",
  house_with_garden: "Casa con jardín",
  rural: "Rural",
  other: "Otro",
};

const SIZE_OPTIONS = [
  { value: "small", label: "Pequeño" },
  { value: "medium", label: "Mediano" },
  { value: "large", label: "Grande" },
];

const SIZE_LABELS: Record<string, string> = {
  small: "Pequeño",
  medium: "Mediano",
  large: "Grande",
};

const ENERGY_LABELS: Record<string, string> = {
  no_preference: "Sin preferencia",
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

function profileToForm(p: AdopterProfile) {
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    province: p.province,
    city: p.city,
    housing_type: p.housing_type,
    has_children: p.has_children,
    children_age_range: p.children_age_range || "",
    has_other_dogs: p.has_other_dogs,
    has_cats: p.has_cats,
    previous_dog_experience: p.previous_dog_experience,
    hours_away_from_home: p.hours_away_from_home,
    activity_level: p.activity_level,
    preferred_sizes: p.preferred_sizes ?? [],
    preferred_age_ranges: p.preferred_age_ranges ?? [],
    preferred_energy: p.preferred_energy,
    adoption_reason: p.adoption_reason,
    important_notes: p.important_notes,
    province_preference: p.province_preference,
    breed_preferences: p.breed_preferences ?? [],
    max_distance_km: p.max_distance_km ?? "",
    consent_marketing: p.consent_marketing,
    consent_contact: p.consent_contact,
  };
}

function CuestionarioInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dogId = searchParams.get("dog");
  const skipDogPrefs = Boolean(dogId);

  const [phase, setPhase] = useState<"email" | "review" | "form">("email");
  const [listingFilters, setListingFilters] = useState<ListingMatchFilters | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [adopterId, setAdopterId] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const showValidationErrors = (errors: string[]) => {
    setValidationErrors(errors);
    if (errors.length) {
      setErr(errors[0]);
      requestAnimationFrame(() => {
        document.getElementById("cuestionario-errores")?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    } else {
      setErr(null);
      setValidationErrors([]);
    }
  };

  const applyListingFiltersToForm = (f: ListingMatchFilters) => {
    setForm((prev) => ({
      ...prev,
      preferred_sizes: f.size ? [f.size] : prev.preferred_sizes,
      preferred_energy: f.energy_level || prev.preferred_energy,
      province_preference: f.province || prev.province_preference,
      breed_preferences: f.breed ? [f.breed] : prev.breed_preferences,
      preferred_age_ranges: f.age ? [f.age] : prev.preferred_age_ranges,
    }));
  };

  useEffect(() => {
    const fromUrl = filtersFromSearchParams(searchParams);
    const stored = readListingFilters();
    const merged: ListingMatchFilters = { ...stored, ...fromUrl };
    if (!hasListingFilters(merged)) return;
    setListingFilters(merged);
    saveListingFilters(merged);
    applyListingFiltersToForm(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al montar con params de listado
  }, []);

  const goNextStep = () => {
    const errors = validateFormStep(step, form, { requireMatchFilters: !dogId, skipDogPrefs });
    if (errors.length) {
      showValidationErrors(errors);
      return;
    }
    showValidationErrors([]);
    setStep((s) => s + 1);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await resolveStoredAdopter();
      if (cancelled) return;
      if (stored) {
        setAdopterId(stored.id);
        setForm(profileToForm(stored));
        setEmailInput(stored.email);
        setPhase("review");
      }
      setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sendResultsEmail = async (email: string) => {
    try {
      const res = (await apiFetch("/api/adopters/send-results-link", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      })) as { message: string };
      setErr(res.message);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo enviar el email");
    }
  };

  const runMatch = async (id: number) => {
    const lf = listingFilters ?? readListingFilters();
    const body: {
      adopter_profile_id: number;
      top_n: number;
      use_ai: boolean;
      dog_id?: number;
      listing_filters?: ListingMatchFilters;
    } = {
      adopter_profile_id: id,
      top_n: dogId ? 1 : 5,
      use_ai: true,
    };
    if (dogId) body.dog_id = Number(dogId);
    else if (lf && hasListingFilters(lf)) {
      body.listing_filters = {
        size: lf.size,
        energy_level: lf.energy_level,
        province: lf.province,
        breed: lf.breed,
      };
    }

    const match = (await apiFetch("/api/matches", {
      method: "POST",
      body: JSON.stringify(body),
    })) as { results: unknown[]; candidates_count?: number; filters_applied?: string | null };

    sessionStorage.setItem(
      "fi_last_match_meta",
      JSON.stringify({
        candidates_count: match.candidates_count ?? 0,
        filters_applied: match.filters_applied ?? "",
      })
    );
    sessionStorage.setItem("fi_last_match", JSON.stringify(match));
    const email = (form.email || emailInput).trim();
    persistAdopterSession(id, email);
    if (email) {
      apiFetch("/api/adopters/send-results-link", {
        method: "POST",
        body: JSON.stringify({ email }),
      }).catch(() => {});
    }

    const q = new URLSearchParams({ adopter: String(id) });
    if (dogId) q.set("dog", dogId);
    router.push(`/resultados?${q.toString()}`);
  };

  const lookupEmail = async () => {
    const emailErrors = validateEmail(emailInput);
    if (emailErrors.length) {
      showValidationErrors(emailErrors);
      return;
    }
    const email = emailInput.trim();
    showValidationErrors([]);
    setLoading(true);
    try {
      const res = (await apiFetch("/api/adopters/lookup", {
        method: "POST",
        body: JSON.stringify({ email }),
      })) as { found: boolean; profile: AdopterProfile | null };

      setForm({ ...EMPTY_FORM, email });

      if (res.found && res.profile) {
        setAdopterId(res.profile.id);
        setForm(profileToForm(res.profile));
        persistAdopterSession(res.profile.id, res.profile.email);
        setPhase("review");
      } else {
        setAdopterId(null);
        setForm({ ...EMPTY_FORM, email });
        setPhase("form");
        setStep(dogId ? 1 : 0);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al buscar el email");
    } finally {
      setLoading(false);
    }
  };

  const saveAndMatch = async () => {
    const errors = validateAllFormSteps(form, { requireMatchFilters: !dogId, skipDogPrefs });
    if (errors.length) {
      showValidationErrors(errors);
      const firstInvalid =
        !skipDogPrefs && form.preferred_sizes.length === 0 && form.preferred_energy === "no_preference"
          ? 0
          : !form.name.trim() || !form.phone.trim() || !form.province.trim() || !form.city.trim()
            ? 1
            : !form.consent_contact
              ? 3
              : step;
      setStep(firstInvalid);
      return;
    }
    showValidationErrors([]);
    setLoading(true);
    try {
      const body = {
        ...form,
        email: form.email || emailInput.trim(),
        max_distance_km: form.max_distance_km === "" ? null : Number(form.max_distance_km),
      };

      let id = adopterId;
      if (id) {
        const updated = (await apiFetch(`/api/adopters/${id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        })) as AdopterProfile;
        id = updated.id;
        setForm(profileToForm(updated));
      } else {
        const created = (await apiFetch("/api/adopters", {
          method: "POST",
          body: JSON.stringify(body),
        })) as AdopterProfile;
        id = created.id;
        setAdopterId(id);
        setForm(profileToForm(created));
      }

      persistAdopterSession(id, form.email || emailInput);
      await runMatch(id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const confirmExisting = async () => {
    if (!adopterId) return;
    setErr(null);
    setLoading(true);
    try {
      await runMatch(adopterId);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error al calcular compatibilidad");
    } finally {
      setLoading(false);
    }
  };

  const dogPreferencesStep = (
    <>
      <h2 style={{ marginTop: 0 }}>¿Qué tipo de perro buscas?</h2>
      <p style={{ color: "var(--muted)", marginTop: 0, marginBottom: "1rem" }}>
        Esto acota el análisis de compatibilidad a perros que encajan contigo. Puedes elegir varias opciones.
      </p>
      <MultiCheckboxGroup
        legend="Tamaño"
        hint="Elige uno o más. Obligatorio tamaño o energía (abajo)."
        options={SIZE_OPTIONS}
        values={form.preferred_sizes}
        max={3}
        onChange={(v) => set("preferred_sizes", v)}
      />
      <div className="field">
        <label>Energía</label>
        <select value={form.preferred_energy} onChange={(e) => set("preferred_energy", e.target.value)}>
          <option value="no_preference">Sin preferencia</option>
          <option value="low">Baja</option>
          <option value="medium">Media</option>
          <option value="high">Alta</option>
        </select>
      </div>
      <MultiCheckboxGroup
        legend="Rango de edad"
        hint="Si no marcas ninguno, no filtramos por edad (indiferente)."
        options={AGE_FILTER_OPTIONS}
        values={form.preferred_age_ranges}
        max={4}
        onChange={(v) => set("preferred_age_ranges", v)}
      />
      <MultiCheckboxGroup
        legend="Raza (orientativa)"
        hint="Hasta 3 razas. Si no marcas ninguna, no filtramos por raza."
        options={BREED_OPTIONS.map((b) => ({ value: b, label: b }))}
        values={form.breed_preferences}
        max={3}
        onChange={(v) => set("breed_preferences", v)}
      />
      <div className="field">
        <label>Provincia preferida para adoptar (opcional)</label>
        <input
          value={form.province_preference}
          onChange={(e) => set("province_preference", e.target.value)}
          placeholder="Ej. Madrid"
        />
        <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0.35rem 0 0" }}>
          No excluye perros de otras provincias: solo prioriza los más cercanos cuando el porcentaje de
          compatibilidad es similar.
        </p>
      </div>
    </>
  );

  const formSteps = [
    dogPreferencesStep,
    <>
      <h2 style={{ marginTop: 0 }}>Sobre ti</h2>
      <div className="field">
        <label>Nombre</label>
        <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
      </div>
      <div className="field">
        <label>Email</label>
        <input type="email" value={form.email} readOnly style={{ opacity: 0.85 }} />
      </div>
      <div className="field">
        <label>Teléfono</label>
        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} required />
      </div>
      <div className="field">
        <label>Provincia (vivienda)</label>
        <input value={form.province} onChange={(e) => set("province", e.target.value)} required />
      </div>
      <div className="field">
        <label>Ciudad</label>
        <input value={form.city} onChange={(e) => set("city", e.target.value)} required />
      </div>
    </>,
    <>
      <h2 style={{ marginTop: 0 }}>Tu hogar y rutina</h2>
      <div className="field">
        <label>Tipo de vivienda</label>
        <select value={form.housing_type} onChange={(e) => set("housing_type", e.target.value)}>
          <option value="apartment">Piso</option>
          <option value="house">Casa</option>
          <option value="house_with_garden">Casa con jardín</option>
          <option value="rural">Rural</option>
          <option value="other">Otro</option>
        </select>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.has_children} onChange={(e) => set("has_children", e.target.checked)} /> Hay
          niños en el hogar
        </label>
      </div>
      {form.has_children ? (
        <div className="field">
          <label>Edades aproximadas (opcional)</label>
          <input value={form.children_age_range} onChange={(e) => set("children_age_range", e.target.value)} />
        </div>
      ) : null}
      <div className="field">
        <label>
          <input type="checkbox" checked={form.has_other_dogs} onChange={(e) => set("has_other_dogs", e.target.checked)} />{" "}
          Ya hay otro perro
        </label>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.has_cats} onChange={(e) => set("has_cats", e.target.checked)} /> Hay gatos
        </label>
      </div>
      <div className="field">
        <label>Experiencia previa con perros</label>
        <select value={form.previous_dog_experience} onChange={(e) => set("previous_dog_experience", e.target.value)}>
          <option value="none">Ninguna</option>
          <option value="low">Poca</option>
          <option value="medium">Media</option>
          <option value="high">Mucha</option>
        </select>
      </div>
      <div className="field">
        <label>Horas habitualmente fuera de casa</label>
        <select value={form.hours_away_from_home} onChange={(e) => set("hours_away_from_home", e.target.value)}>
          <option value="0-2">0–2 h</option>
          <option value="3-5">3–5 h</option>
          <option value="6-8">6–8 h</option>
          <option value="more_than_8">Más de 8 h</option>
        </select>
      </div>
      <div className="field">
        <label>Nivel de actividad del hogar</label>
        <select value={form.activity_level} onChange={(e) => set("activity_level", e.target.value)}>
          <option value="low">Bajo</option>
          <option value="medium">Medio</option>
          <option value="high">Alto</option>
        </select>
      </div>
    </>,
    <>
      <h2 style={{ marginTop: 0 }}>Motivación y consentimientos</h2>
      <div className="field">
        <label>Distancia máx. (km, opcional)</label>
        <input type="number" value={form.max_distance_km} onChange={(e) => set("max_distance_km", e.target.value)} min={0} />
      </div>
      <div className="field">
        <label>Motivo de adopción</label>
        <textarea value={form.adoption_reason} onChange={(e) => set("adoption_reason", e.target.value)} />
      </div>
      <div className="field">
        <label>Notas importantes</label>
        <textarea value={form.important_notes} onChange={(e) => set("important_notes", e.target.value)} />
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.consent_contact} onChange={(e) => set("consent_contact", e.target.checked)} />{" "}
          Consiento ser contactado/a por el refugio (obligatorio)
        </label>
      </div>
      <div className="field">
        <label>
          <input type="checkbox" checked={form.consent_marketing} onChange={(e) => set("consent_marketing", e.target.checked)} />{" "}
          Comunicaciones opcionales sobre adopción
        </label>
      </div>
    </>,
  ];

  const progressOpts = { skipDogPrefs };
  const currentStep = getQuestionnaireStep(phase, step, progressOpts);
  const totalSteps = getQuestionnaireTotalSteps(progressOpts);

  const reviewBlock = (
    <>
      <h2 style={{ marginTop: 0 }}>Tus respuestas guardadas</h2>
      <p style={{ color: "var(--muted)", marginTop: 0 }}>
        Hemos encontrado un perfil con <strong>{form.email}</strong>. Revisa que siga siendo correcto.
      </p>
      <ul style={{ margin: "0 0 1rem", paddingLeft: "1.2rem", lineHeight: 1.6 }}>
        <li>
          <strong>{form.name}</strong> · {form.phone} · {form.city}, {form.province}
        </li>
        <li>Vivienda: {HOUSING_LABELS[form.housing_type] || form.housing_type}</li>
        <li>
          Niños: {form.has_children ? `Sí${form.children_age_range ? ` (${form.children_age_range})` : ""}` : "No"} · Otro
          perro: {form.has_other_dogs ? "Sí" : "No"} · Gatos: {form.has_cats ? "Sí" : "No"}
        </li>
        <li>
          Perro:{" "}
          {form.preferred_sizes.length
            ? form.preferred_sizes.map((s) => SIZE_LABELS[s] || s).join(", ")
            : "cualquier tamaño"}
          {" · "}
          energía {ENERGY_LABELS[form.preferred_energy] || form.preferred_energy}
          {form.preferred_age_ranges.length
            ? ` · edad ${form.preferred_age_ranges.map((a) => AGE_LABELS_SHORT[a] || a).join(", ")}`
            : " · edad indiferente"}
        </li>
        {form.breed_preferences.length ? (
          <li>Razas preferidas: {form.breed_preferences.join(", ")}</li>
        ) : null}
        {form.province_preference ? <li>Provincia preferida: {form.province_preference}</li> : null}
      </ul>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <button type="button" className="btn btn-primary" disabled={loading} onClick={confirmExisting}>
          {loading ? "Calculando…" : dogId ? "Ver compatibilidad con este perro" : "Confirmar y ver mis matches"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => sendResultsEmail(form.email)}
        >
          Enviar enlace por email
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => {
            setPhase("form");
            setStep(skipDogPrefs ? 1 : 0);
          }}
        >
          Editar respuestas
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={loading}
          onClick={() => {
            clearAdopterSession();
            setPhase("email");
            setAdopterId(null);
            setEmailInput("");
            setForm(EMPTY_FORM);
          }}
        >
          Usar otro email
        </button>
      </div>
    </>
  );

  const showIntro = !booting && phase !== "review";

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.pageHeader}>
        <h1 style={{ marginTop: 0 }}>¿Encaja contigo?</h1>
        {dogId ? (
          <p style={{ color: "var(--muted)" }}>
            Comprobaremos la compatibilidad con el perro que estabas viendo.{" "}
            <Link href={`/perros/${dogId}`}>Volver a la ficha</Link>
          </p>
        ) : (
          <p style={{ color: "var(--muted)" }}>
            Primero tu email; después empezamos por el tipo de perro que buscas. Si ya tienes perfil, lo recuperamos.
          </p>
        )}
      </div>

      <div className={styles.pageBody}>
        {showIntro ? <QuestionnaireIntro /> : null}

        <div className={`card ${styles.formCard}`}>
        {validationErrors.length > 0 ? (
          <div id="cuestionario-errores" className="notice" role="alert" style={{ marginBottom: "1rem" }}>
            <strong style={{ display: "block", marginBottom: "0.35rem" }}>Faltan datos por completar</strong>
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {validationErrors.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {booting ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>Comprobando si ya tienes perfil guardado…</p>
        ) : null}

        {!booting && phase === "email" && currentStep ? (
          <>
            <StepProgress current={currentStep} total={totalSteps} />
            <StepHint step={currentStep} />
            <h2 style={{ marginTop: 0 }}>Tu email</h2>
            <div className="field">
              <label>Email</label>
              <input
                id="cuestionario-email"
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
                aria-invalid={validationErrors.length > 0}
                aria-describedby={validationErrors.length ? "cuestionario-errores" : undefined}
                onKeyDown={(e) => e.key === "Enter" && lookupEmail()}
              />
            </div>
            <button type="button" className="btn btn-primary" disabled={loading} onClick={lookupEmail}>
              {loading ? "Buscando…" : "Continuar"}
            </button>
          </>
        ) : null}

        {!booting && phase === "review" ? reviewBlock : null}

        {!booting && phase === "form" && currentStep ? (
          <>
            <StepProgress current={currentStep} total={totalSteps} />
            <StepHint step={currentStep} />
            {adopterId ? (
              <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 0.75rem" }}>Estás editando tu perfil guardado.</p>
            ) : null}
            {formSteps[step]}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", gap: "0.5rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={skipDogPrefs ? step <= 1 : step === 0}
                onClick={() => {
                  showValidationErrors([]);
                  setStep((s) => s - 1);
                }}
              >
                Atrás
              </button>
              {step < formSteps.length - 1 ? (
                <button type="button" className="btn btn-primary" onClick={goNextStep}>
                  Siguiente
                </button>
              ) : (
                <button type="button" className="btn btn-primary" disabled={loading} onClick={saveAndMatch}>
                  {loading ? "Calculando…" : dogId ? "Ver compatibilidad" : "Ver mis matches"}
                </button>
              )}
            </div>
            {adopterId ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setPhase("review")}
              >
                Cancelar edición
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: "0.75rem" }}
                onClick={() => setPhase("email")}
              >
                Cambiar email
              </button>
            )}
          </>
        ) : null}

        {!booting && phase === "review" && err && !validationErrors.length ? (
          <p className="notice" style={{ marginTop: "1rem" }}>
            {err}
          </p>
        ) : null}
        </div>
      </div>
    </div>
  );
}

export default function CuestionarioPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "2rem" }}>Cargando…</div>}>
      <CuestionarioInner />
    </Suspense>
  );
}
