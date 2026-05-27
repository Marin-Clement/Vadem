/* global React */
const { useState, useEffect, useRef } = React;

// =========================================================
// Icon set — minimal stroke icons (original)
// =========================================================
const Icon = ({ name, size = 16, stroke = 1.6 }) => {
  const props = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round",
  };
  switch (name) {
    case "home": return <svg {...props}><path d="M3 11l9-8 9 8" /><path d="M5 9v11h14V9" /></svg>;
    case "user": return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>;
    case "history": return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>;
    case "draft": return <svg {...props}><rect x="3" y="4" width="7" height="7"/><rect x="14" y="4" width="7" height="7"/><rect x="3" y="13" width="7" height="7"/><rect x="14" y="13" width="7" height="7"/></svg>;
    case "build": return <svg {...props}><path d="M14 4l6 6-10 10H4v-6z"/><path d="M13 5l6 6"/></svg>;
    case "macro": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19"/></svg>;
    case "overlay": return <svg {...props}><rect x="3" y="3" width="18" height="14" rx="2"/><path d="M3 21h18"/><circle cx="17" cy="10" r="2"/></svg>;
    case "settings": return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a7.97 7.97 0 0 0 0-6l1.6-2-2-2-2 1.6a7.97 7.97 0 0 0-6 0L9 5 7 7l1.6 2a7.97 7.97 0 0 0 0 6L7 17l2 2 2-1.6a7.97 7.97 0 0 0 6 0L19 19l2-2z"/></svg>;
    case "search": return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>;
    case "minus": return <svg {...props}><path d="M5 12h14"/></svg>;
    case "square": return <svg {...props}><rect x="5" y="5" width="14" height="14" rx="1"/></svg>;
    case "x": return <svg {...props}><path d="M18 6L6 18M6 6l12 12"/></svg>;
    case "trend-up": return <svg {...props}><path d="M3 17l6-6 4 4 7-7"/><path d="M14 8h6v6"/></svg>;
    case "trend-down": return <svg {...props}><path d="M3 7l6 6 4-4 7 7"/><path d="M14 16h6v-6"/></svg>;
    case "chevron-right": return <svg {...props}><path d="M9 6l6 6-6 6"/></svg>;
    case "chevron-left": return <svg {...props}><path d="M15 6l-6 6 6 6"/></svg>;
    case "chevron-down": return <svg {...props}><path d="M6 9l6 6 6-6"/></svg>;
    case "play": return <svg {...props} fill="currentColor" stroke="none"><path d="M6 4l14 8-14 8z"/></svg>;
    case "alert": return <svg {...props}><path d="M12 3l10 17H2z"/><path d="M12 9v5"/><circle cx="12" cy="17.5" r="0.6" fill="currentColor"/></svg>;
    case "spark": return <svg {...props}><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>;
    case "shield": return <svg {...props}><path d="M12 2l8 3v7c0 5-3.5 9-8 10-4.5-1-8-5-8-10V5z"/></svg>;
    case "crosshair": return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>;
    case "filter": return <svg {...props}><path d="M3 4h18l-7 8v7l-4-2v-5z"/></svg>;
    case "calendar": return <svg {...props}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "trophy": return <svg {...props}><path d="M6 4h12v3a6 6 0 1 1-12 0z"/><path d="M6 7H3v2a3 3 0 0 0 3 3M18 7h3v2a3 3 0 0 1-3 3"/><path d="M9 17h6v3H9z"/></svg>;
    case "swap": return <svg {...props}><path d="M7 4l-4 4 4 4M3 8h14M17 12l4 4-4 4M21 16H7"/></svg>;
    case "lock": return <svg {...props}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>;
    case "spinner": return <svg {...props} style={{animation: "spin-slow 1.4s linear infinite"}}><path d="M12 3a9 9 0 1 1-9 9" /></svg>;
    default: return null;
  }
};

// =========================================================
// Champion glyph
// =========================================================
const Champ = ({ id, size, className = "", showName = false, withTooltip = false }) => {
  const c = window.champById(id);
  if (!c) return <div className={`champ ${size ? size : ""} ${className}`}><span>?</span></div>;
  const cls = `champ ${size ? size : ""} role-${c.role.toLowerCase()} ${className}`;
  const inner = <div className={cls}><span>{c.initials}</span></div>;
  if (withTooltip) {
    return (
      <div className="tip-root">
        {inner}
        <div className="tip">
          <span className="tip-name">{c.name}</span>
          <div className="tip-row"><span className="tip-meta">ROLE</span><span className="t-mono">{c.role}</span></div>
          <div className="tip-row"><span className="tip-meta">CLASS</span><span className="t-mono">{c.tags.join(" / ")}</span></div>
        </div>
      </div>
    );
  }
  if (showName) return <div style={{display:"flex",alignItems:"center",gap:8}}>{inner}<span style={{fontSize:13}}>{c.name}</span></div>;
  return inner;
};

// =========================================================
// Item glyph
// =========================================================
const ItemGlyph = ({ id, size, withTooltip = true }) => {
  if (!id) return <div className={`item empty ${size||""}`}>—</div>;
  const it = window.ITEMS[id];
  if (!it) return <div className={`item ${size||""}`}>?</div>;
  const inner = <div className={`item ${it.tier} ${size||""}`}>{it.glyph}</div>;
  if (!withTooltip) return inner;
  return (
    <div className="tip-root">
      {inner}
      <div className="tip">
        <span className="tip-name">{it.name}</span>
        <div className="tip-row"><span className="tip-meta">{it.tier.toUpperCase()}</span></div>
        <div style={{fontSize:11, color:"var(--fg-2)", marginTop:6, whiteSpace:"normal", maxWidth: 220}}>{it.desc}</div>
      </div>
    </div>
  );
};

// =========================================================
// KDA helper
// =========================================================
const KDARatio = ({ k, d, a }) => {
  const r = d === 0 ? "Perfect" : ((k + a) / d).toFixed(2);
  return (
    <div className="match-stats">
      <span className="match-kda">{k} / <span style={{color:"var(--red)"}}>{d}</span> / {a}</span>
      <span className="match-kda-detail">{r} KDA</span>
    </div>
  );
};

// =========================================================
// Sparkline
// =========================================================
const Sparkline = ({ data, height = 36, color }) => {
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
      <path d={path} className="spark-line" stroke={color || "var(--accent)"}/>
      <circle cx={last[0]} cy={last[1]} r={2.5} className="spark-dot" />
    </svg>
  );
};

// =========================================================
// Donut
// =========================================================
const Donut = ({ value, size = 80, stroke = 8, color = "var(--accent)", label }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{position:"relative", width: size, height: size, display:"grid", placeItems:"center"}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-4)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                style={{transition: "stroke-dashoffset 600ms ease"}}/>
      </svg>
      <div style={{position:"absolute", textAlign:"center"}}>
        <div className="t-display" style={{fontSize: size * 0.26, fontWeight: 700, lineHeight: 1}}>{value}<span style={{fontSize: size * 0.14, color:"var(--fg-3)"}}>%</span></div>
        {label && <div className="t-mono" style={{fontSize: 9, color:"var(--fg-3)", letterSpacing: "0.10em", marginTop: 2}}>{label}</div>}
      </div>
    </div>
  );
};

// =========================================================
// Live ticker hook — for animating values in the overlay
// =========================================================
const useTicker = (intervalMs = 1000) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
};

// =========================================================
// Stat tile
// =========================================================
const StatTile = ({ label, value, trend, trendLabel, suffix, color }) => (
  <div className="stat tactical">
    <span className="stat-label">{label}</span>
    <div className="stat-value" style={color ? {color} : undefined}>{value}{suffix && <span style={{fontSize:18, color:"var(--fg-3)", marginLeft:2}}>{suffix}</span>}</div>
    {trend != null && (
      <span className={`stat-trend ${trend >= 0 ? "up" : "down"}`}>
        <Icon name={trend >= 0 ? "trend-up" : "trend-down"} size={11}/>
        {trend >= 0 ? "+" : ""}{trend}{trendLabel || ""}
      </span>
    )}
  </div>
);

Object.assign(window, { Icon, Champ, ItemGlyph, KDARatio, Sparkline, Donut, useTicker, StatTile });
