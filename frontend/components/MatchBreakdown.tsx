type Item = { key: string; label: string; percent: number; status: string };

const STATUS_COLORS: Record<string, string> = {
  good: "var(--accent)",
  warn: "var(--warn)",
  risk: "#c45c5c",
  neutral: "var(--muted)",
};

export function MatchBreakdown({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: "0.75rem" }}>
      <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--muted)" }}>
        Desglose orientativo
      </p>
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.45rem" }}>
        {items.map((it) => (
          <li key={it.key}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: 2 }}>
              <span>{it.label}</span>
              <span style={{ color: STATUS_COLORS[it.status] ?? "inherit", fontWeight: 600 }}>
                {it.percent}%
              </span>
            </div>
            <div
              style={{
                height: 5,
                borderRadius: 999,
                background: "#e4e8e7",
                overflow: "hidden",
              }}
              role="presentation"
            >
              <div
                style={{
                  width: `${it.percent}%`,
                  height: "100%",
                  background: STATUS_COLORS[it.status] ?? "var(--accent)",
                  borderRadius: 999,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
