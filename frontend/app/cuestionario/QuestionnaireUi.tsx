import styles from "./cuestionario.module.css";

export const QUESTIONNAIRE_TOTAL_STEPS = 4;

export function getQuestionnaireStep(
  phase: "presel" | "email" | "review" | "form",
  formStep: number
): number | null {
  if (phase === "review" || phase === "presel") return null;
  if (phase === "email") return 1;
  return Math.min(formStep + 2, QUESTIONNAIRE_TOTAL_STEPS);
}

export function QuestionnaireIntro() {
  return (
    <aside className={styles.intro} aria-label="Información sobre el cuestionario">
      <p className={styles.introTitle}>¿Para qué son estas preguntas?</p>
      <div className={styles.introGrid}>
        <p>
          Queremos conocer tu hogar, tu día a día y qué buscas en un perro. Con eso, FriendInMe puede orientarte hacia
          animales que encajen contigo y con los refugios que colaboran en la plataforma.
        </p>
        <p>
          Utilizamos <strong>inteligencia artificial</strong>, junto con los datos que cada refugio registra sobre sus
          perros, para calcular un <strong>match orientativo</strong> entre tu perfil y cada animal. No sustituye la
          visita ni la valoración del refugio, pero te ayuda a priorizar con criterio.
        </p>
        <p>
          Por eso es importante responder con la <strong>mayor exactitud posible</strong>: cuanto más fiel sea tu perfil,
          más útiles serán las recomendaciones y el contacto con el refugio.
        </p>
      </div>
    </aside>
  );
}

export function StepProgress({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className={styles.progress} role="status" aria-live="polite" aria-label={`Paso ${current} de ${total}`}>
      <div className={styles.progressMeta}>
        <span>
          Paso {current}/{total}
        </span>
        <span style={{ fontWeight: 500, color: "var(--muted)", fontSize: "0.82rem" }}>{pct}%</span>
      </div>
      <div className={styles.progressTrack} aria-hidden>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const STEP_HINTS: Record<number, string> = {
  1: "Identificación — usamos tu email para recuperar tu perfil si ya lo completaste.",
  2: "Datos personales y contacto.",
  3: "Tu hogar, convivencia y rutina diaria.",
  4: "Preferencias sobre el perro y consentimientos.",
};

export function StepHint({ step }: { step: number }) {
  const hint = STEP_HINTS[step];
  if (!hint) return null;
  return <p className={styles.stepHint}>{hint}</p>;
}
