"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredAdopterId } from "@/lib/adopter-session";

type Props = { dogId: number };

export function MatchBadge({ dogId }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adopterId = getStoredAdopterId();
    if (!adopterId) {
      setLoading(false);
      return;
    }
    apiFetch(`/api/matches/preview?adopter_profile_id=${adopterId}&dog_id=${dogId}`)
      .then((r) => {
        const row = r as { compatibility_score: number };
        setScore(row.compatibility_score);
      })
      .catch(() => setScore(null))
      .finally(() => setLoading(false));
  }, [dogId]);

  if (loading || score === null) return null;

  return (
    <p
      style={{
        margin: "0 0 1rem",
        padding: "0.65rem 1rem",
        borderRadius: 10,
        background: "linear-gradient(145deg, #e8f4f1 0%, #f5f2eb 100%)",
        border: "1px solid var(--border)",
        fontSize: "0.95rem",
      }}
    >
      Compatibilidad orientativa contigo: <strong>{score}%</strong> — basada en tu cuestionario.
    </p>
  );
}
