import { Icon } from "./Icon";

// =========================================================
// KDA helper
// =========================================================
interface KDARatioProps { k: number; d: number; a: number; }
export function KDARatio({ k, d, a }: KDARatioProps) {
  const r = d === 0 ? "Perfect" : ((k + a) / d).toFixed(2);
  return (
    <div className="match-stats">
      <span className="match-kda">
        {k} / <span style={{ color: "var(--red)" }}>{d}</span> / {a}
      </span>
      <span className="match-kda-detail">{r} KDA</span>
    </div>
  );
}

// =========================================================
// Sparkline
// =========================================================
interface SparklineProps {
  data: number[];
  height?: number;
  color?: string;
}
export function Sparkline({ data, height = 36, color }: SparklineProps) {
  const w = 240;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - 4 - ((v - min) / (max - min || 1)) * (height - 8);
    return [x, y];
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${w},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <path d={area} className="spark-area" />
      <path d={path} className="spark-line" stroke={color || "var(--accent)"} />
      <circle cx={last[0]} cy={last[1]} r={2.5} className="spark-dot" />
    </svg>
  );
}

// =========================================================
// Donut
// =========================================================
interface DonutProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}
export function Donut({ value, size = 80, stroke = 8, color = "var(--accent)", label }: DonutProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, display: "grid", placeItems: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div className="t-display" style={{ fontSize: size * 0.26, fontWeight: 700, lineHeight: 1 }}>
          {value}<span style={{ fontSize: size * 0.14, color: "var(--fg-3)" }}>%</span>
        </div>
        {label && (
          <div className="t-mono" style={{ fontSize: 9, color: "var(--fg-3)", letterSpacing: "0.10em", marginTop: 2 }}>
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// =========================================================
// Stat tile
// =========================================================
interface StatTileProps {
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  suffix?: string;
  color?: string;
}
export function StatTile({ label, value, trend, trendLabel, suffix, color }: StatTileProps) {
  return (
    <div className="stat tactical">
      <span className="stat-label">{label}</span>
      <div className="stat-value" style={color ? { color } : undefined}>
        {value}
        {suffix && <span style={{ fontSize: 18, color: "var(--fg-3)", marginLeft: 2 }}>{suffix}</span>}
      </div>
      {trend != null && (
        <span className={`stat-trend ${trend >= 0 ? "up" : "down"}`}>
          <Icon name={trend >= 0 ? "trend-up" : "trend-down"} size={11} />
          {trend >= 0 ? "+" : ""}{trend}{trendLabel || ""}
        </span>
      )}
    </div>
  );
}
