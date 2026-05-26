import defaultStyles from "@/app/page.module.css";
import { PublicDogsListing } from "@/components/PublicDogsListing";

type Styles = typeof defaultStyles;

type Props = {
  /** Permite usar estilos de Home1 en /home1 */
  moduleStyles?: Styles;
  variant?: "default" | "compact" | "home";
};

export function HomeDogsSection({ moduleStyles = defaultStyles, variant = "default" }: Props) {
  const styles = moduleStyles;
  const compact = variant === "compact";
  const isHome = variant === "home";

  return (
    <section className={styles.dogsSection} aria-labelledby="home-dogs-heading" id="perros">
      <div className={styles.dogsInner}>
        <div className={styles.dogsHeader}>
          <h2 id="home-dogs-heading" className={styles.dogsTitle}>
            {isHome ? "Perros que podrían encajar contigo" : "Perros en adopción"}
          </h2>
          {isHome ? (
            <p className={styles.dogsLead}>
              Filtra por provincia, tamaño, energía, edad y raza. El % de compatibilidad aparece tras el cuestionario.
            </p>
          ) : compact ? (
            <p className={styles.dogsLeadCompact}>
              Filtra y explora fichas reales. El match orientativo está en el cuestionario.
            </p>
          ) : (
            <p className={styles.dogsLead}>
              Explora las fichas disponibles. Para un match orientativo con tu perfil, usa el cuestionario.
            </p>
          )}
        </div>
        <PublicDogsListing compact={compact} variant={isHome ? "home" : "default"} />
      </div>
    </section>
  );
}
