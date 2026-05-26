import styles from "./compat-ring.module.css";

type Props = {
  pct: number;
  size?: "sm" | "md";
};

export function CompatRing({ pct, size = "md" }: Props) {
  const value = Math.min(100, Math.max(0, Math.round(pct)));
  return (
    <div
      className={`${styles.ring} ${size === "sm" ? styles.ringSm : ""}`}
      style={{ "--pct": String(value) } as React.CSSProperties}
      aria-label={`${value} por ciento de compatibilidad`}
    >
      <span className={styles.inner}>
        <strong>{value}%</strong>
        {size === "md" ? <small>compat.</small> : null}
      </span>
    </div>
  );
}
