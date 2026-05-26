import { HomeComoFunciona } from "@/components/home/HomeComoFunciona";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeShelterCta } from "@/components/home/HomeShelterCta";
import { HomeDogsSection } from "@/components/HomeDogsSection";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <HomeHero />
      <HomeComoFunciona />
      <HomeDogsSection moduleStyles={styles} variant="home" />
      <HomeShelterCta />
    </div>
  );
}
