interface WipBannerProps {
  label?: string;
  compact?: boolean;
}

export function WipBanner({ label = "Work in progress", compact = false }: WipBannerProps) {
  if (compact) {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 8px", borderRadius: 4,
        background: "oklch(0.30 0.07 60 / 0.5)",
        border: "1px solid oklch(0.60 0.17 60 / 0.4)",
        fontFamily: "var(--ff-mono)", fontSize: 10, letterSpacing: "0.06em",
        color: "var(--amber)",
      }}>
        <span style={{ fontSize: 9 }}>▲</span>
        {label.toUpperCase()}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "7px 12px", borderRadius: 6, marginBottom: 12,
      background: "oklch(0.28 0.07 60 / 0.45)",
      border: "1px solid oklch(0.60 0.17 60 / 0.40)",
      borderLeft: "3px solid var(--amber)",
      fontFamily: "var(--ff-mono)", fontSize: 11,
      color: "oklch(0.80 0.13 60)",
    }}>
      <span style={{ fontSize: 13, lineHeight: 1 }}>▲</span>
      <span style={{ flex: 1 }}>{label}</span>
    </div>
  );
}

export function WipTag() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 7px", borderRadius: 4,
      background: "oklch(0.28 0.07 60 / 0.5)",
      border: "1px solid oklch(0.60 0.17 60 / 0.4)",
      fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.08em",
      color: "var(--amber)", fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      WIP
    </span>
  );
}
