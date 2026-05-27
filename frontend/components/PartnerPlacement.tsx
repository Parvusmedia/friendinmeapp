"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  fetchResolvedPartnerCampaign,
  type PartnerDogContext,
  type PartnerPlacementId,
  type ResolvedPartnerCampaign,
} from "@/lib/partner-placements";
import styles from "./partner-placement.module.css";

type Props = {
  placement: PartnerPlacementId;
  context?: PartnerDogContext;
  compact?: boolean;
  className?: string;
};

export function PartnerPlacement({ placement, context = {}, compact = false, className = "" }: Props) {
  const [campaign, setCampaign] = useState<ResolvedPartnerCampaign | null>(null);
  const dogId = context.dogId;
  const dogName = context.dogName;

  useEffect(() => {
    let cancelled = false;
    fetchResolvedPartnerCampaign(placement, context).then((c) => {
      if (!cancelled) setCampaign(c);
    });
    return () => {
      cancelled = true;
    };
  }, [placement, dogId, dogName, context.size, context.energy_level, context.age_estimate]);

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
        {campaign.discount_code ? (
          <p className={styles.discount}>
            {campaign.discount_note ?? `Código: ${campaign.discount_code}`}
          </p>
        ) : null}
        <Link
          href={campaign.cta_url}
          className={`btn btn-secondary ${styles.cta}`}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          {campaign.cta_label}
        </Link>
      </div>
      <p className={styles.sponsor}>Ofrecido por {campaign.sponsor_name}</p>
    </aside>
  );
}
