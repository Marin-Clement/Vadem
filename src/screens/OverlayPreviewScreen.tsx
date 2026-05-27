import { useState, useEffect } from "react";
import { useGameState } from "../hooks/useGameState";
import { computeWinProb } from "../utils/winProb";
import { LIVE_OBJECTIVES } from "../data/mockData";

type Position = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface WidgetProps {
  position: Position;
  isLive: boolean;
  prob: number;
  timeStr: string;
  goldLead: number;
}

function OverlayWidget({ position, isLive, prob, timeStr, goldLead }: WidgetProps) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Objective timers — tick-driven when in preview, real objectives list
  const drakeObj = LIVE_OBJECTIVES.find(o => o.id === "dragon")!;
  const drakeTime = isLive ? drakeObj.time : Math.max(0, 92 - (tick % 120));
  const dm = Math.floor(drakeTime / 60);
  const ds = drakeTime % 60;

  const baronObj = LIVE_OBJECTIVES.find(o => o.id === "baron")!;
  const baronTime = isLive ? baronObj.time : Math.max(0, 318 - tick);
  const bm = Math.floor(baronTime / 60);
  const bs = baronTime % 60;

  const deltaLabel = goldLead >= 0
    ? `+${(goldLead / 1000).toFixed(1)}k gold lead`
    : `${(goldLead / 1000).toFixed(1)}k gold deficit`;

  return (
    <div className={`overlay-widget ${position}`}>
      <div className="overlay-header">
        <div className="overlay-title">
          <span style={{
            display: "inline-block", width: 6, height: 6, borderRadius: "50%",
            background: isLive ? "var(--green)" : "var(--amber)",
            boxShadow: `0 0 6px ${isLive ? "var(--green)" : "var(--amber)"}`,
          }} />
          YuumiPal · {isLive ? "Live" : "Preview"}
        </div>
        <span className="overlay-time">{timeStr}</span>
      </div>

      <div className="overlay-body">
        {/* Win probability bar */}
        <div>
          <div style={{
            display: "flex", justifyContent: "space-between", marginBottom: 4,
            fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.10em",
            color: "rgba(255,255,255,0.6)",
          }}>
            <span>WIN PROBABILITY</span>
            <span style={{ color: isLive ? "var(--green)" : "var(--accent)", fontWeight: 700 }}>
              {isLive ? "MODEL LIVE" : "SIMULATED"}
            </span>
          </div>
          <div className="overlay-winrate-bar">
            <div className="overlay-winrate-blue" style={{ width: `${prob}%` }}>{prob}%</div>
            <div className="overlay-winrate-red">{100 - prob}%</div>
          </div>
          <div style={{
            marginTop: 4, fontFamily: "var(--ff-mono)", fontSize: 9,
            color: prob >= 50 ? "rgba(130,255,180,0.7)" : "rgba(255,100,100,0.7)",
          }}>
            {deltaLabel}
          </div>
        </div>

        {/* AI tip */}
        <div className="overlay-tip">
          <div className="overlay-tip-icon">!</div>
          <div className="overlay-tip-text">
            {isLive
              ? <><strong>Model input active</strong> — ONNX running locally. See Macro tab for full analysis.</>
              : <><strong>Set up Rift Herald</strong> at 19:30 — Vi has smite + closer pathing. <strong style={{ color: "var(--accent)" }}>+8% win</strong>.</>
            }
          </div>
        </div>

        {/* Objectives */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div className="overlay-objective-row">
            <div className="overlay-obj-icon" style={{ background: "oklch(0.45 0.18 25)", color: "white" }}>DR</div>
            <span className="overlay-obj-name">Infernal Dragon</span>
            <span className="overlay-obj-time">
              {drakeTime === 0 ? "READY" : `${dm}:${ds.toString().padStart(2, "0")}`}
            </span>
          </div>
          <div className="overlay-objective-row">
            <div className="overlay-obj-icon" style={{ background: "oklch(0.45 0.16 295)", color: "white" }}>RH</div>
            <span className="overlay-obj-name">Rift Herald</span>
            <span className="overlay-obj-time ready">READY</span>
          </div>
          <div className="overlay-objective-row">
            <div className="overlay-obj-icon" style={{ background: "oklch(0.45 0.14 75)", color: "white" }}>BN</div>
            <span className="overlay-obj-name">Baron Nashor</span>
            <span className="overlay-obj-time" style={{ color: "var(--fg-3)" }}>
              {baronTime > 0 ? `${bm}:${bs.toString().padStart(2, "0")}` : "READY"}
            </span>
          </div>
        </div>
      </div>

      <div className="overlay-footer">
        <button className="overlay-footer-btn">BUILD</button>
        <button className="overlay-footer-btn">MAP</button>
        <button className="overlay-footer-btn" style={{ background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)" }}>OPEN</button>
      </div>
    </div>
  );
}

export function OverlayPreviewScreen() {
  const [position, setPosition] = useState<Position>("bottom-right");

  // Real game state + win model
  const game = useGameState();
  const [realProb, setRealProb] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // Recompute win probability every time game state changes
  useEffect(() => {
    if (!game.isGameActive) { setRealProb(null); return; }
    computeWinProb(game).then(setRealProb);
  }, [game]);

  // Tick for simulated preview animation
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const isLive = game.isGameActive && realProb !== null;

  // Display values: real model output when live, sine-wave sim when previewing
  const displayProb = isLive
    ? Math.round(realProb! * 100)
    : Math.round(62 + Math.sin(tick / 4) * 3);

  const displayTime = isLive
    ? `${Math.floor(game.gameTime / 60)}:${Math.floor(game.gameTime % 60).toString().padStart(2, "0")}`
    : `18:${(24 + (tick % 60)).toString().padStart(2, "0")}`;

  // Gold lead: real when live, simulated when preview
  const goldLead = isLive
    ? game.allyGold - game.enemyGold
    : 2400 + Math.round(Math.sin(tick / 6) * 800);

  return (
    <div className="content fade-up">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div className="t-eyebrow">
          OVERLAY PREVIEW · POSITION: {position.toUpperCase()}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLive ? (
            <span className="tag win" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", display: "inline-block" }} />
              ONNX MODEL LIVE
            </span>
          ) : (
            <span className="tag" style={{ color: "var(--amber)", borderColor: "var(--amber)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--amber)", display: "inline-block" }} />
              PREVIEW · NO GAME
            </span>
          )}
        </div>
      </div>

      {/* 16:9 game view */}
      <div className="panel" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
        <div style={{
          position: "relative", aspectRatio: "16 / 9",
          background: "oklch(0.10 0.02 280)", overflow: "hidden",
        }}>
          {/* Watermark */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            color: "rgba(255,255,255,0.06)", fontFamily: "var(--ff-display)",
            fontSize: 80, fontWeight: 700, letterSpacing: "-0.04em",
          }}>
            RIFTLINE
          </div>
          {/* Simulated HUD bar */}
          <div style={{
            position: "absolute", top: 16, left: 16, right: 16,
            display: "flex", justifyContent: "space-between",
            color: "rgba(255,255,255,0.5)", fontFamily: "var(--ff-mono)", fontSize: 11,
          }}>
            <span>{isLive ? `[ IN GAME · ${game.mySummoner || "You"} ]` : "[ Game in progress · placeholder ]"}</span>
            <span>{displayTime}</span>
          </div>
          <OverlayWidget
            position={position}
            isLive={isLive}
            prob={displayProb}
            timeStr={displayTime}
            goldLead={goldLead}
          />
        </div>
      </div>

      {/* Position selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {(["top-left", "top-right", "bottom-left", "bottom-right"] as Position[]).map(k => (
          <button
            key={k}
            className={`btn btn-sm ${position === k ? "btn-primary" : ""}`}
            onClick={() => setPosition(k)}
          >
            {k.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </button>
        ))}
      </div>

      {/* Info panel: what the model reads */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title"><span className="panel-title-dot" /> YuumiPal Win Model · feature inputs</div>
          <span className="t-mono fg-3" style={{ fontSize: 10 }}>ONNX LOCAL INFERENCE</span>
        </div>
        <div className="panel-body">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "Kill diff",    val: isLive ? game.killDiff    : "+3" },
              { label: "Gold diff",    val: isLive ? `${((game.allyGold - game.enemyGold) / 1000).toFixed(1)}k` : "+2.4k" },
              { label: "Tower diff",   val: isLive ? game.towerDiff   : "+1" },
              { label: "Dragon diff",  val: isLive ? game.dragonDiff  : "+1" },
              { label: "Level diff",   val: isLive ? game.levelDiff   : "+2" },
              { label: "CS diff",      val: isLive ? game.csDiff      : "+18" },
              { label: "Item value",   val: isLive ? `${(game.itemValueDiff / 1000).toFixed(1)}k` : "+1.2k" },
              { label: "Baron active", val: isLive ? (game.blueBaronActive || game.redBaronActive ? "YES" : "NO") : "NO" },
            ].map(f => (
              <div key={f.label} style={{
                padding: "8px 10px", background: "var(--bg-3)",
                borderRadius: 6, border: "1px solid var(--line-1)",
              }}>
                <div className="t-eyebrow" style={{ marginBottom: 2 }}>{f.label}</div>
                <div className="t-mono" style={{ fontSize: 13, fontWeight: 600, color: isLive ? "var(--accent)" : "var(--fg-2)" }}>
                  {String(f.val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
