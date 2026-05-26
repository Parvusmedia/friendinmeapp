"use client";

import Link from "next/link";
import {
  type PartnerDogContext,
  type PartnerPlacementId,
  resolvePartnerCampaign,
} from "@/lib/partner-placements";
import styles from "./partner-placement.module.css";

type Props = {
  placement: PartnerPlacementId;
  context?: PartnerDogContext;
  compact?: boolean;
  className?: string;
};

export function PartnerPlacement({ placement, context = {}, compact = false, className = "" }: Props) {
  const campaign = resolvePartnerCampaign(placement, context);
  if (!campaign) return null;

  const wrapClass = `${styles.wrap}${compact ? ` ${styles.wrapCompact}` : ""}${className ? ` ${className}` : ""}`;

  return (
    <aside className={wrapClass} aria-label="Recomendación de partner">
      <span className={styles.badge}>Recomendación de partner · Contenido patrocinado</span>
      <div className={styles.head}>
        {campaign.icon ? (
          <span className={styles.icon} aria-hidden>
            {campaign.icon}
          </span>
        ) : null}
        <h3 className={styles.headline}>{campaign.headline}</h3>
      </div>
      <p className={styles.body}>{campaign.body}</p>
      {campaign.bullets?.length ? (
        <ul className={styles.list}>
          {campaign.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      <div className={styles.footer}>
        {campaign.discountCode ? (
          <p className={styles.discount}>
            {campaign.discountNote ?? `Código: ${campaign.discountCode}`}
          </p>
        ) : null}
        <Link
          href={campaign.ctaUrl}
          className={`btn btn-secondary ${styles.cta}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          {campaign.ctaLabel}
        </Link>
      </div>
      <p className={styles.sponsor}>Ofrecido por {campaign.sponsorName}</p>
    </aside>
  );
}
