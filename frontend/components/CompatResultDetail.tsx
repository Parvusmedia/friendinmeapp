"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BREAKDOWN_ICONS,
  breakdownStatusLabel,
  matchLevelHeadline,
  matchLevelLabel,
} from "@/lib/match-labels";
import { buildQuickSummary } from "@/lib/match-summary";
import { resolveMediaUrl } from "@/lib/media-url";
import styles from "./compat-result-detail.module.css";

type BreakdownItem = { key: string; label: string; percent: number; status: string };

type DogInfo = {
  id: number;
  name: string;
  city: string;
  province: string;
  main_image_url: string | null;
};

type Props = {
  dog: DogInfo;
  score: number;
  matchLevel: string;
  reasons: string[];
  warnings: string[];
  aiExplanation: string | null;
  breakdown: BreakdownItem[];
  adopterId: string;
};

function barClass(status: string): string {
  if (status === "risk") return styles.barFillRisk;
  if (status === "warn") return styles.barFillWarn;
  if (status === "neutral") return styles.barFillNeutral;
  return styles.barFillGood;
}

export function CompatResultDetail({
  dog,
  score,
  matchLevel,
  reasons,
  warnings,
  aiExplanation: _aiExplanation,
  breakdown,
  adopterId,
}: Props) {
  const pct = Math.round(score);
  const levelLabel = matchLevelLabel(matchLevel);
  const summary = buildQuickSummary(dog.name, score, matchLevel, reasons, warnings);

  const contactHref = `/contacto?dog=${dog.id}&adopter=${adopterId}&score=${pct}`;

  return (
    <article className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.photo}>
          {dog.main_image_url ? (
            <Image
              src={resolveMediaUrl(dog.main_image_url)}
              alt=""
              fill
              className={styles.photoImg}
              sizes="88px"
              unoptimized
            />
          ) : (
            <div className={styles.photoEmpty} aria-hidden />
          )}
        </div>
        <div className={styles.headerMain}>
          <h2>{dog.name}</h2>
          <p className={styles.location}>
            📍 {[dog.city, dog.province].filter(Boolean).join(", ") || "Ubicación no indicada"}
          </p>
          <span className={styles.badge}>✓ Compatibilidad analizada</span>
        </div>
        <div className={styles.headerScore}>
          <div className={styles.ringLg} style={{ "--pct": String(pct) } as React.CSSProperties} aria-hidden>
            <div className={styles.ringLgInner}>
              <strong>{pct}</strong>
              <span>/100</span>
            </div>
          </div>
          <div className={styles.scoreText}>
            <strong>{levelLabel}</strong>
            <p>{matchLevelHeadline(matchLevel, dog.name)}</p>
          </div>
        </div>
      </header>

      <section className={styles.summaryBox} aria-labelledby="resumen-rapido">
        <div className={styles.summaryIcon} aria-hidden>
          💚
        </div>
        <div className={styles.summaryBody}>
          <h3 id="resumen-rapido">Resumen rápido</h3>
          <p className={styles.summaryScorePill}>{summary.scoreLine}</p>
          <p className={styles.summaryIntro}>{summary.intro}</p>

          {summary.positives.length > 0 ? (
            <div className={`${styles.summaryBlock} ${styles.summaryBlockGood}`}>
              <p className={styles.summaryBlockTitle}>✅ Lo que encaja bien</p>
              <ul className={styles.summaryList}>
                {summary.positives.map((item, i) => (
                  <li key={i}>
                    <span className={styles.summaryListIcon} aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.infoGaps.length > 0 ? (
            <div className={`${styles.summaryBlock} ${styles.summaryBlockWarn}`}>
              <p className={styles.summaryBlockTitle}>🔍 Confirmar con el refugio</p>
              <ul className={styles.summaryList}>
                {summary.infoGaps.map((item, i) => (
                  <li key={i}>
                    <span className={styles.summaryListIcon} aria-hidden>
                      ?
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.otherWarnings.length > 0 ? (
            <div className={`${styles.summaryBlock} ${styles.summaryBlockAlert}`}>
              <p className={styles.summaryBlockTitle}>⚠️ Otras consideraciones</p>
              <ul className={styles.summaryList}>
                {summary.otherWarnings.map((item, i) => (
                  <li key={i}>
                    <span className={styles.summaryListIcon} aria-hidden>
                      !
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className={styles.summaryDisclaimer}>Es una guía orientativa, no una garantía.</p>
        </div>
      </section>

      {breakdown.length > 0 ? (
        <section className={styles.breakdownSection} aria-labelledby="desglose-areas">
          <h3 id="desglose-areas">📊 Desglose por áreas</h3>
          <div className={styles.breakdownGrid}>
            {breakdown.map((it) => (
              <div key={it.key} className={styles.breakdownItem}>
                <div className={styles.breakdownIcon} aria-hidden>
                  {BREAKDOWN_ICONS[it.key] ?? "•"}
                </div>
                <p className={styles.breakdownLabel}>{it.label}</p>
                <div className={styles.barTrack} role="presentation">
                  <div
                    className={`${styles.barFill} ${barClass(it.status)}`}
                    style={{ width: `${it.percent}%` }}
                  />
                </div>
                <p className={styles.breakdownPct}>{it.percent}%</p>
                <p className={styles.breakdownStatus}>{breakdownStatusLabel(it.percent, it.status)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className={styles.infoBox} aria-labelledby="como-interpretar">
        <span aria-hidden style={{ fontSize: "1.25rem" }}>
          ℹ️
        </span>
        <div>
          <h3 id="como-interpretar">Cómo interpretar este resultado</h3>
          <p>
            La puntuación resume el encaje según la información del cuestionario y la ficha del refugio. No sustituye
            una visita ni la valoración del equipo del refugio. Usa este análisis para preparar preguntas y decidir si
            quieres conocer al perro en persona.
          </p>
        </div>
      </section>

      <div className={styles.ctas}>
        <Link href={contactHref} className={`btn btn-primary ${styles.ctaPrimary}`}>
          <span aria-hidden>♥</span> Quiero conocer a {dog.name}
        </Link>
        <Link href={`/perros/${dog.id}`} className={`btn btn-secondary ${styles.ctaSecondary}`}>
          <span aria-hidden>📄</span> Ver ficha completa
        </Link>
      </div>
    </article>
  );
}
