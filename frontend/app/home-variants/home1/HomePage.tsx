import Link from "next/link";
import { HomeDogsSection } from "@/components/HomeDogsSection";
import styles from "./home1.module.css";

const features = [
  {
    icon: "🧩",
    title: "Compatibilidad, no moda",
    text: "Energía, hogar, niños, otros animales y tiempo disponible importan más que la estética.",
  },
  {
    icon: "✓",
    title: "Transparencia",
    text: "Si falta información en la ficha, te lo decimos. La IA nunca inventa datos del perro.",
  },
  {
    icon: "♡",
    title: "Contacto directo",
    text: "Cuando hay feeling, tu solicitud llega al refugio. Ellos conocen al animal en carne y hueso.",
  },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.inner}>
          <p className={styles.badge}>Adopción responsable</p>
          <h1 className={styles.title}>
            No busques solo
            <br /> un perro bonito.
            <br />
            <span className={styles.accent}>Encuentra el compañero que encaja contigo.</span>
          </h1>
          <p className={styles.lead}>
            FriendInMe cruza tu estilo de vida con la ficha real de cada perro. Sin promesas mágicas: información
            clara, compatibilidad orientativa y refugios de confianza.
          </p>
          <div className={styles.actions}>
            <Link href="/cuestionario" className={styles.btnPrimary}>
              Encontrar mi match
            </Link>
            <Link href="/refugio/solicitud" className={styles.btnSecondary}>
              Soy un refugio
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          {features.map((x) => (
            <article key={x.title} className={styles.card}>
              <div className={styles.cardIcon} aria-hidden="true">
                {x.icon}
              </div>
              <div>
                <h3 className={styles.cardTitle}>{x.title}</h3>
                <p className={styles.cardText}>{x.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <HomeDogsSection moduleStyles={styles} variant="default" />
    </div>
  );
}
