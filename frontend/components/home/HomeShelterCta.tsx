import Link from "next/link";
import styles from "@/app/page.module.css";

export function HomeShelterCta() {
  return (
    <section className={styles.shelterCta} aria-labelledby="shelter-cta-heading">
      <div className={styles.shelterCtaShell}>
        <div className={styles.shelterCtaIcon} aria-hidden>
          🏠🐾
        </div>
        <div className={styles.shelterCtaCopy}>
          <h2 id="shelter-cta-heading" className={styles.shelterCtaTitle}>
            ¿Tienes un refugio?
          </h2>
          <p className={styles.shelterCtaText}>
            Publica fichas, gestiona solicitudes y llega a adoptantes que buscan compatibilidad real, no solo fotos
            bonitas.
          </p>
          <Link href="/refugio/solicitud" className={styles.shelterCtaBtn}>
            Registrar refugio →
          </Link>
        </div>
        <div className={styles.shelterCtaVisual} aria-hidden>
          🐕
        </div>
      </div>
    </section>
  );
}
