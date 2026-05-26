import Link from "next/link";
import { HomeDogsSection } from "@/components/HomeDogsSection";
import styles from "./page.module.css";

const features = [
  {
    icon: "🧩",
    title: "Compatibilidad, no moda",
    text: "Energía, hogar y tiempo disponible importan más que la estética.",
  },
  {
    icon: "✓",
    title: "Transparencia",
    text: "Si falta información en la ficha, te lo decimos.",
  },
  {
    icon: "♡",
    title: "Contacto directo",
    text: "Tu solicitud llega al refugio que conoce al perro.",
  },
];

/** Home2 — perros y filtros visibles antes; hero y valores más compactos. */
export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-label="Presentación">
        <div className={styles.heroShell}>
          <div className={styles.heroMain}>
            <p className={styles.badge}>Adopción responsable</p>
            <h1 className={styles.title}>
              Encuentra el compañero que{" "}
              <span className={styles.accent}>encaja contigo</span>
            </h1>
            <p className={styles.lead}>
              Cruza tu estilo de vida con fichas reales de refugios. Match orientativo, sin promesas mágicas.
            </p>
          </div>
          <div className={styles.heroAside}>
            <Link href="/cuestionario" className={styles.btnPrimary}>
              Encontrar mi match
            </Link>
            <Link href="/refugio/solicitud" className={styles.btnSecondary}>
              Soy un refugio
            </Link>
            <a href="#perros" className={styles.heroScroll}>
              Ver perros ↓
            </a>
          </div>
        </div>
      </section>

      <HomeDogsSection variant="compact" />

      <section className={styles.values} aria-label="Por qué FriendInMe">
        <div className={styles.valuesShell}>
          <p className={styles.valuesKicker}>Por qué FriendInMe</p>
          <div className={styles.valuesGrid}>
            {features.map((x) => (
              <article key={x.title} className={styles.valueCard}>
                <span className={styles.valueIcon} aria-hidden="true">
                  {x.icon}
                </span>
                <div>
                  <h3 className={styles.valueTitle}>{x.title}</h3>
                  <p className={styles.valueText}>{x.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
