import { champById, ITEMS } from "../data/mockData";
import { useDDragon, champIconUrl, itemIconUrl, resolveChampId, resolveItemId } from "../utils/ddragon";

interface ChampProps {
  id: string;
  size?: "xs" | "sm" | "" | "lg" | "xl";
  className?: string;
  showName?: boolean;
  withTooltip?: boolean;
}

export function Champ({ id, size = "", className = "", showName = false, withTooltip = false }: ChampProps) {
  const ddr = useDDragon();
  const c = champById(id);

  const name = c?.name ?? id;
  // resolveChampId handles both lowercase mock IDs and DDragon-form IDs from the API
  const champId = ddr ? resolveChampId(id, ddr.champByName) || resolveChampId(name, ddr.champByName) : null;
  const imgUrl = champId && ddr ? champIconUrl(ddr.version, champId) : null;
  const initials = c?.initials ?? id.slice(0, 2).toUpperCase();
  const cls = `champ ${size} role-${(c?.role ?? "mid").toLowerCase()} ${className}`;

  const inner = (
    <div className={cls}>
      {imgUrl && (
        <img
          src={imgUrl}
          alt={name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const span = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (span) span.style.removeProperty("display");
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 2, display: imgUrl ? "none" : undefined }}>
        {initials}
      </span>
    </div>
  );

  if (withTooltip) {
    return (
      <div className="tip-root">
        {inner}
        <div className="tip">
          <span className="tip-name">{name}</span>
          {c && (
            <>
              <div className="tip-row">
                <span className="tip-meta">ROLE</span>
                <span className="t-mono">{c.role}</span>
              </div>
              <div className="tip-row">
                <span className="tip-meta">CLASS</span>
                <span className="t-mono">{c.tags.join(" / ")}</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (showName) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {inner}
        <span style={{ fontSize: 13 }}>{name}</span>
      </div>
    );
  }

  return inner;
}

// ── Item glyph ────────────────────────────────────────────────────────────────

interface ItemGlyphProps {
  id: string | null | undefined;
  size?: "lg" | "";
  withTooltip?: boolean;
}

export function ItemGlyph({ id, size = "", withTooltip = true }: ItemGlyphProps) {
  const ddr = useDDragon();

  if (!id) return <div className={`item empty ${size}`}>—</div>;

  const it = ITEMS[id];
  if (!it) return <div className={`item ${size}`}>?</div>;

  const itemId = ddr ? (resolveItemId(it.name, ddr.itemByName) ?? (it.ddragonId ? String(it.ddragonId) : null)) : null;
  const imgUrl = itemId && ddr ? itemIconUrl(ddr.version, itemId) : null;

  const inner = (
    <div className={`item ${it.tier} ${size}`} style={{ position: "relative", overflow: "hidden" }}>
      {imgUrl && (
        <img
          src={imgUrl}
          alt={it.name}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
            const span = e.currentTarget.nextElementSibling as HTMLElement | null;
            if (span) span.style.removeProperty("display");
          }}
        />
      )}
      <span style={{ position: "relative", zIndex: 2, display: imgUrl ? "none" : undefined }}>
        {it.glyph}
      </span>
    </div>
  );

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

// ── DDragonItem — renders items by numeric DDragon ID (from the live API) ────

interface DDragonItemProps {
  itemId: number | null | undefined;
  size?: "lg" | "";
}

export function DDragonItem({ itemId, size = "" }: DDragonItemProps) {
  const ddr = useDDragon();

  if (!itemId) return <div className={`item empty ${size}`}>—</div>;

  const imgUrl = ddr ? itemIconUrl(ddr.version, String(itemId)) : null;

  return (
    <div className={`item ${size}`} style={{ position: "relative", overflow: "hidden" }}>
      {imgUrl && (
        <img
          src={imgUrl}
          alt={String(itemId)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
    </div>
  );
}
