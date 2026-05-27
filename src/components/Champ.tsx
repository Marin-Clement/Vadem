import { champById, ITEMS } from "../data/mockData";

interface ChampProps {
  id: string;
  size?: "xs" | "sm" | "" | "lg" | "xl";
  className?: string;
  showName?: boolean;
  withTooltip?: boolean;
}

export function Champ({ id, size = "", className = "", showName = false, withTooltip = false }: ChampProps) {
  const c = champById(id);
  if (!c) {
    return (
      <div className={`champ ${size} ${className}`}>
        <span>?</span>
      </div>
    );
  }

  const cls = `champ ${size} role-${c.role.toLowerCase()} ${className}`;

  const inner = (
    <div className={cls}>
      <span>{c.initials}</span>
    </div>
  );

  if (withTooltip) {
    return (
      <div className="tip-root">
        {inner}
        <div className="tip">
          <span className="tip-name">{c.name}</span>
          <div className="tip-row">
            <span className="tip-meta">ROLE</span>
            <span className="t-mono">{c.role}</span>
          </div>
          <div className="tip-row">
            <span className="tip-meta">CLASS</span>
            <span className="t-mono">{c.tags.join(" / ")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (showName) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {inner}
        <span style={{ fontSize: 13 }}>{c.name}</span>
      </div>
    );
  }

  return inner;
}

interface ItemGlyphProps {
  id: string | null | undefined;
  size?: "lg" | "";
  withTooltip?: boolean;
}

export function ItemGlyph({ id, size = "", withTooltip = true }: ItemGlyphProps) {
  if (!id) return <div className={`item empty ${size}`}>—</div>;

  const it = ITEMS[id];
  if (!it) return <div className={`item ${size}`}>?</div>;

  const inner = <div className={`item ${it.tier} ${size}`}>{it.glyph}</div>;
  if (!withTooltip) return inner;

  return (
    <div className="tip-root">
      {inner}
      <div className="tip">
        <span className="tip-name">{it.name}</span>
        <div className="tip-row">
          <span className="tip-meta">{it.tier.toUpperCase()}</span>
        </div>
        <div style={{ fontSize: 11, color: "var(--fg-2)", marginTop: 6, whiteSpace: "normal", maxWidth: 220 }}>
          {it.desc}
        </div>
      </div>
    </div>
  );
}
