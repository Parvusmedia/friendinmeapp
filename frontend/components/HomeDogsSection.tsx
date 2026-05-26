import styles from "@/app/page.module.css";
import { PublicDogsListing } from "@/components/PublicDogsListing";

export function HomeDogsSection() {
  return (
    <section className={styles.dogsSection} aria-labelledby="home-dogs-heading" id="perros">
      <div className={styles.dogsInner}>
        <div className={styles.dogsHeader}>
          <h2 id="home-dogs-heading" className={styles.dogsTitle}>
            Perros en adopción
          </h2>
          <p className={styles.dogsLead}>
            Explora las fichas disponibles. Para un match orientativo con tu perfil, usa el cuestionario.
          </p>
        </div>
        <PublicDogsListing />
      </div>
    </section>
  );
}
