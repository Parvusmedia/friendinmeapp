import { matchLevelHeadline, matchLevelLabel } from "./match-labels";

export function isInfoGapWarning(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.startsWith("no consta") ||
    t.includes("información pendiente") ||
    t.includes("provisional") ||
    t.includes("por confirmar")
  );
}

export function partitionWarnings(warnings: string[]): { infoGaps: string[]; other: string[] } {
  const infoGaps: string[] = [];
  const other: string[] = [];
  for (const w of warnings) {
    if (isInfoGapWarning(w)) infoGaps.push(w);
    else other.push(w);
  }
  return { infoGaps, other };
}

export type QuickSummaryModel = {
  scoreLine: string;
  intro: string;
  positives: string[];
  infoGaps: string[];
  otherWarnings: string[];
};

export function buildQuickSummary(
  dogName: string,
  score: number,
  matchLevel: string,
  reasons: string[],
  warnings: string[]
): QuickSummaryModel {
  const { infoGaps, other } = partitionWarnings(warnings);
  const positives = reasons.filter((r) => !r.toLowerCase().startsWith("no consta")).slice(0, 4);

  return {
    scoreLine: `${Math.round(score)}/100 · ${matchLevelLabel(matchLevel)}`,
    intro: matchLevelHeadline(matchLevel, dogName),
    positives,
    infoGaps: infoGaps.slice(0, 5),
    otherWarnings: other.slice(0, 4),
  };
}
