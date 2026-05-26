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
            <span className={styles.shelterCtaFree}>Gratis</span>
            <span className={styles.shelterCtaTitleText}>¿Tienes un refugio?</span>
          </h2>
          <p className={styles.shelterCtaText}>
            Publica fichas, gestiona solicitudes y llega a adoptantes que buscan compatibilidad real, no solo fotos
            bonitas. <strong>Sin coste para tu refugio.</strong>
          </p>
          <Link href="/refugio/solicitud" className={styles.shelterCtaBtn}>
            Registrar refugio →
          </Link>
          <p className={styles.shelterCtaLegal}>
            El registro de refugios es gratuito. FriendInMe se financia mediante publicidad y colaboraciones del sector
            —{" "}
            <Link href="/privacidad#modelo-financiacion">
              ver modelo de financiación (política de privacidad, punto 3)
            </Link>
            .
          </p>
        </div>
        <div className={styles.shelterCtaVisual} aria-hidden>
          🐕
        </div>
      </div>
    </section>
  );
}
