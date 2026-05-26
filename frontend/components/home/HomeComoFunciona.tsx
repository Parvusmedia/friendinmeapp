import styles from "@/app/page.module.css";

const STEPS = [
  {
    icon: "📋",
    title: "Cuéntanos cómo vives",
    text: "Un cuestionario breve sobre tu hogar, rutina y preferencias.",
  },
  {
    icon: "🧩",
    title: "Analizamos compatibilidad",
    text: "Cruzamos tu perfil solo con perros que encajan en lo esencial.",
  },
  {
    icon: "♥",
    title: "Descubre perros que encajan",
    text: "Explora fichas reales y contacta al refugio con criterio.",
  },
];

export function HomeComoFunciona() {
  return (
    <section id="como-funciona" className={styles.howSection} aria-labelledby="how-heading">
      <div className={styles.howShell}>
        <h2 id="how-heading" className={styles.howTitle}>
          Cómo funciona
        </h2>
        <ol className={styles.howSteps}>
          {STEPS.map((step, i) => (
            <li key={step.title} className={styles.howStep}>
              <div className={styles.howIcon} aria-hidden>
                {step.icon}
              </div>
              <div>
                <h3 className={styles.howStepTitle}>
                  {i + 1}. {step.title}
                </h3>
                <p className={styles.howStepText}>{step.text}</p>
              </div>
              {i < STEPS.length - 1 ? (
                <span className={styles.howArrow} aria-hidden>
                  →
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
