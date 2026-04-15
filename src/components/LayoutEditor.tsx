import { useState, useRef, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../hooks/useSettings";

interface LolConfig {
  hudScale:     number | null;
  minimapScale: number | null;
  foundAt:      string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// LoL HUD element definitions
// All base dimensions are percentages of a 1920×1080 screen at 100% scale.
// ─────────────────────────────────────────────────────────────────────────────

interface LolElement {
  key:       string;
  label:     string;
  baseW:     number;
  baseH:     number;
  scaleBy:   "hud" | "minimap";
  anchor:    "top-center" | "top-right" | "bottom-center" | "bottom-right" | "bottom-left";
  padTop?:    number;
  padRight?:  number;
  padBottom?: number;
  padLeft?:   number;
}

// Measured from LoL at 1920×1080 (px → %).
// Based on in-game screenshot analysis:
//   • Score/timer bar  → top-right  (~17% wide, just off the top edge)
//   • Kill feed        → top-right  (below score bar, ~9% wide)
//   • HUD              → bottom-center (~37% wide, 12% tall)
//   • Minimap          → bottom-right  (square, ~11%)
//   • Chat             → bottom-left   (sits above the HUD)
const LOL_ELEMENTS: LolElement[] = [
  {
    // Score + timer bar — top right of screen (~340×55 px at 100%)
    key: "score", label: "Score/Timer",
    baseW: 17.7, baseH: 5.1,
    scaleBy: "hud", anchor: "top-right",
    padRight: 0.4, padTop: 0,
  },
  {
    // Main HUD — bottom center (portrait + HP/mana + abilities + items)
    key: "hud", label: "HUD",
    baseW: 36.5, baseH: 12.0,          // ~700×130 px
    scaleBy: "hud", anchor: "bottom-center",
    padBottom: 0,
  },
  {
    // Minimap — bottom right corner
    key: "minimap", label: "Minimap",
    baseW: 10.9, baseH: 19.4,          // ~210×210 px (square in 16:9 %)
    scaleBy: "minimap", anchor: "bottom-right",
    padRight: 0.3, padBottom: 0.5,
  },
  {
    // Chat box — bottom left, sitting above the HUD
    key: "chat", label: "Chat",
    baseW: 18.2, baseH: 8.3,           // ~350×90 px
    scaleBy: "hud", anchor: "bottom-left",
    padLeft: 0.3, padBottom: 13.0,
  },
];

function computeLolRect(el: LolElement, hudScale: number, minimapScale: number) {
  const s = (el.scaleBy === "hud" ? hudScale : minimapScale) / 100;
  const w = el.baseW * s;
  const h = el.baseH * s;
  let left = 0, top = 0;
  switch (el.anchor) {
    case "top-center":    left = 50 - w / 2;                     top = el.padTop ?? 0;                       break;
    case "top-right":     left = 100 - w - (el.padRight ?? 0);   top = el.padTop ?? 0;                       break;
    case "bottom-center": left = 50 - w / 2;                     top = 100 - h - (el.padBottom ?? 0);        break;
    case "bottom-right":  left = 100 - w - (el.padRight ?? 0);   top = 100 - h - (el.padBottom ?? 0);        break;
    case "bottom-left":   left = el.padLeft ?? 0;                top = 100 - h - (el.padBottom ?? 0);        break;
  }
  return { left, top, width: w, height: h };
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay token definitions (draggable)
// ─────────────────────────────────────────────────────────────────────────────

interface TokenDef {
  id:            "tab" | "timers";
  label:         string;
  borderColor:   string;
  bgColor:       string;
  realWidthPct:  number;
  realHeightPct: number;
  lines:         number;
}

const TOKENS: TokenDef[] = [
  { id: "tab",    label: "TAB Overlay", borderColor: "var(--color-accent)", bgColor: "rgba(91,141,238,0.15)", realWidthPct: 15, realHeightPct: 38, lines: 5 },
  { id: "timers", label: "Timers",      borderColor: "var(--color-win)",    bgColor: "rgba(74,222,128,0.15)", realWidthPct: 11, realHeightPct: 16, lines: 2 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  settings: AppSettings;
  onSave:   (updates: Partial<AppSettings>) => void;
}

export function LayoutEditor({ settings, onSave }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep onSave in a ref so syncLolScales never needs to be recreated
  // (avoids the bug where every position-save restarts the LoL sync effect)
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  // Scale values — seeded from settings, updated by LoL sync
  const [hudScale,     setHudScale]     = useState(settings.hudScale);
  const [minimapScale, setMinimapScale] = useState(settings.minimapScale);
  const [lolStatus,    setLolStatus]    = useState<"loading" | "ok" | "notfound">("loading");

  // Overlay drag positions
  const [positions, setPositions] = useState({
    tab:    { left: settings.tabOverlayLeft,    top: settings.tabOverlayTop },
    timers: { left: settings.timersOverlayLeft, top: settings.timersOverlayTop },
  });
  const posRef = useRef(positions);
  useEffect(() => { posRef.current = positions; }, [positions]);

  // Sync positions when settings change from outside (e.g. another window)
  useEffect(() => {
    setPositions({
      tab:    { left: settings.tabOverlayLeft,    top: settings.tabOverlayTop },
      timers: { left: settings.timersOverlayLeft, top: settings.timersOverlayTop },
    });
  }, [settings.tabOverlayLeft, settings.tabOverlayTop,
      settings.timersOverlayLeft, settings.timersOverlayTop]);

  // ── Auto-sync LoL scales from game.cfg ────────────────────────────────────
  // Stable reference — uses onSaveRef so it never needs to be recreated
  const syncLolScales = useCallback(async () => {
    setLolStatus("loading");
    try {
      const cfg = await invoke<LolConfig>("read_lol_config");
      if (!cfg.foundAt) { setLolStatus("notfound"); return; }

      const updates: Partial<AppSettings> = {};
      if (cfg.hudScale     != null) { setHudScale(cfg.hudScale);         updates.hudScale     = cfg.hudScale; }
      if (cfg.minimapScale != null) { setMinimapScale(cfg.minimapScale); updates.minimapScale = cfg.minimapScale; }
      if (Object.keys(updates).length > 0) onSaveRef.current(updates);
      setLolStatus("ok");
    } catch {
      setLolStatus("notfound");
    }
  }, []); // stable — intentionally no deps, uses onSaveRef

  // Run once on mount only
  useEffect(() => { syncLolScales(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Drag logic ─────────────────────────────────────────────────────────────
  const dragRef = useRef<{
    id: "tab" | "timers";
    startMouseX: number; startMouseY: number;
    startLeft: number;   startTop: number;
    maxLeft: number;     maxTop: number;
  } | null>(null);

  const onTokenMouseDown = (id: "tab" | "timers", e: React.MouseEvent) => {
    e.preventDefault();
    const tok = TOKENS.find((t) => t.id === id)!;
    const cur = posRef.current[id];
    dragRef.current = {
      id,
      startMouseX: e.clientX, startMouseY: e.clientY,
      startLeft: cur.left,    startTop: cur.top,
      maxLeft: 100 - tok.realWidthPct,
      maxTop:  100 - tok.realHeightPct,
    };

    const onMouseMove = (e: MouseEvent) => {
      const d = dragRef.current;
      const container = containerRef.current;
      if (!d || !container) return;
      const rect = container.getBoundingClientRect();
      const dx = ((e.clientX - d.startMouseX) / rect.width)  * 100;
      const dy = ((e.clientY - d.startMouseY) / rect.height) * 100;
      setPositions((prev) => ({
        ...prev,
        [d.id]: {
          left: Math.max(0, Math.min(d.maxLeft, d.startLeft + dx)),
          top:  Math.max(0, Math.min(d.maxTop,  d.startTop  + dy)),
        },
      }));
    };

    const onMouseUp = () => {
      const d = dragRef.current;
      if (!d) return;
      const final = posRef.current[d.id];
      if (d.id === "tab") onSave({ tabOverlayLeft: final.left, tabOverlayTop: final.top });
      else                onSave({ timersOverlayLeft: final.left, timersOverlayTop: final.top });
      dragRef.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup",   onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup",   onMouseUp);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">
      {/* ── LoL scale status bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-2xs text-text-muted">
        <span>
          {lolStatus === "loading" && "Reading LoL config…"}
          {lolStatus === "ok" && (
            <>
              LoL detected ·{" "}
              <span className="font-mono text-text-secondary">
                HUD {hudScale}% · Minimap {minimapScale}%
              </span>
            </>
          )}
          {lolStatus === "notfound" && "LoL config not found — using last values"}
        </span>
        <button
          onClick={syncLolScales}
          className="px-1.5 py-0.5 rounded border border-surface-border bg-surface-raised
                     text-2xs text-text-muted hover:text-text-primary hover:border-accent/40
                     transition-colors"
        >
          ↺
        </button>
      </div>

      {/* ── Game-screen preview ─────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden border border-surface-border select-none"
        style={{ aspectRatio: "16/9", background: "#070a0f" }}
      >
        {/* Grid */}
        {[25, 50, 75].map((p) => (
          <div key={`h${p}`} className="absolute w-full border-t border-white/[0.04]" style={{ top:  `${p}%` }} />
        ))}
        {[25, 50, 75].map((p) => (
          <div key={`v${p}`} className="absolute h-full border-l border-white/[0.04]" style={{ left: `${p}%` }} />
        ))}

        {/* LoL HUD placeholders */}
        {LOL_ELEMENTS.map((el) => {
          const rect = computeLolRect(el, hudScale, minimapScale);
          return (
            <div
              key={el.key}
              className="absolute pointer-events-none"
              style={{
                left: `${rect.left}%`, top: `${rect.top}%`,
                width: `${rect.width}%`, height: `${rect.height}%`,
                border: "1px dashed rgba(200,164,68,0.45)",
                background: "rgba(200,164,68,0.06)",
                borderRadius: "2px",
              }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center font-medium"
                style={{ fontSize: "0.5rem", color: "rgba(200,164,68,0.65)" }}
              >
                {el.label}
              </span>
            </div>
          );
        })}

        {/* Draggable overlay tokens */}
        {TOKENS.map((tok) => {
          const pos = positions[tok.id];
          return (
            <div
              key={tok.id}
              className="absolute rounded cursor-grab active:cursor-grabbing"
              style={{
                left: `${pos.left}%`, top: `${pos.top}%`,
                width: `${tok.realWidthPct}%`, height: `${tok.realHeightPct}%`,
                border: `1px solid ${tok.borderColor}`,
                background: tok.bgColor,
                zIndex: 10,
              }}
              onMouseDown={(e) => onTokenMouseDown(tok.id, e)}
            >
              <div className="px-1 py-0.5 font-semibold leading-none truncate"
                   style={{ fontSize: "0.5rem", color: tok.borderColor }}>
                ⠿ {tok.label}
              </div>
              <div className="px-1 mt-0.5 space-y-0.5">
                {Array.from({ length: tok.lines }).map((_, i) => (
                  <div key={i} className="rounded-sm" style={{
                    height: "1.5px", background: tok.borderColor,
                    opacity: 0.3, width: i % 2 === 0 ? "90%" : "65%",
                  }} />
                ))}
              </div>
            </div>
          );
        })}

        <span className="absolute bottom-1 right-1.5 pointer-events-none"
              style={{ fontSize: "0.48rem", color: "rgba(255,255,255,0.18)" }}>
          1920 × 1080
        </span>
      </div>

      {/* Position readout */}
      <div className="flex gap-3 text-2xs text-text-muted font-mono">
        <span>TAB <span style={{ color: "var(--color-accent)" }}>
          {Math.round(positions.tab.left)}%,{Math.round(positions.tab.top)}%
        </span></span>
        <span>·</span>
        <span>Timers <span style={{ color: "var(--color-win)" }}>
          {Math.round(positions.timers.left)}%,{Math.round(positions.timers.top)}%
        </span></span>
      </div>
    </div>
  );
}
