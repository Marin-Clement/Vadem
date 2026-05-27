import { useState, useEffect } from "react";
import { useGameState } from "../hooks/useGameState";
import { useSettings } from "../hooks/useSettings";
import { computeWinProb } from "../utils/winProb";
import { getDDragon, champIconUrl, resolveChampId } from "../utils/ddragon";
import type { PlayerSummary } from "../store/gameStore";

interface DDragonCtx {
  version: string;
  champByName: Record<string, string>;
}

export default function TabOverlay() {
  const game = useGameState();
  const { settings } = useSettings();
  const [winProb, setWinProb] = useState<number | null>(null);
  const [ddragon, setDdragon] = useState<DDragonCtx | null>(null);

  useEffect(() => {
    getDDragon().then(setDdragon);
  }, []);

  useEffect(() => {
    if (!settings.showWinPrediction) { setWinProb(null); return; }
    computeWinProb(game).then(setWinProb);
  }, [game, settings.showWinPrediction]);

  if (!game.isGameActive) return null;

  const mins = Math.floor(game.gameTime / 60);
  const secs = Math.floor(game.gameTime % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, "0")}`;

  const prob = winProb !== null ? Math.round(winProb * 100) : null;
  const goldLead = game.allyGold - game.enemyGold;
  const deltaLabel = goldLead >= 0
    ? `+${(goldLead / 1000).toFixed(1)}k gold lead`
    : `${(goldLead / 1000).toFixed(1)}k gold deficit`;

  const isOrder = game.myTeam === "ORDER";
  const allies  = game.players.filter(p => p.team === game.myTeam);
  const enemies = game.players.filter(p => p.team !== game.myTeam);

  // Normalise diffs to local player's perspective
  const myDragonDiff = isOrder ? game.dragonDiff : -game.dragonDiff;
  const myHasSoul    = isOrder ? game.blueHasSoul : game.redHasSoul;
  const myBaronActive    = isOrder ? game.blueBaronActive : game.redBaronActive;
  const enemyBaronActive = isOrder ? game.redBaronActive  : game.blueBaronActive;
  const myElderActive    = isOrder ? game.blueElderActive : game.redElderActive;
  const enemyElderActive = isOrder ? game.redElderActive  : game.blueElderActive;

  const dragonLabel = myHasSoul
    ? "SOUL"
    : myDragonDiff > 0 ? `+${myDragonDiff}`
    : myDragonDiff < 0 ? `${myDragonDiff}`
    : "0";

  const baronLabel = myBaronActive ? "ALLY" : enemyBaronActive ? "ENEMY" : "UP";
  const elderLabel = myElderActive ? "ALLY" : enemyElderActive ? "ENEMY" : "—";

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
      <div style={{
        position: "absolute",
        ...(settings.overlayPos.includes("right")  ? { right: "1%" }  : { left:   "1%" }),
        ...(settings.overlayPos.includes("bottom") ? { bottom: "8%" } : { top:    "8%" }),
        width: 280,
        pointerEvents: "none",
      }}>
        {/* Widget shell — same visual as OverlayPreviewScreen */}
        <div style={{
          background: "oklch(0.10 0.02 280 / 0.92)",
          backdropFilter: "blur(20px)",
          border: "1px solid oklch(0.68 0.20 295 / 0.4)",
          borderRadius: "var(--r-3)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          overflow: "hidden",
          color: "white",
          fontFamily: "var(--ff-sans)",
        }}>

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="overlay-header">
            <div className="overlay-title">
              <span style={{
                display: "inline-block", width: 6, height: 6, borderRadius: "50%",
                background: "var(--green)", boxShadow: "0 0 6px var(--green)",
              }} />
              Vadem · Live
            </div>
            <span className="overlay-time">{timeStr}</span>
          </div>

          {/* ── Body ────────────────────────────────────────────────── */}
          <div className="overlay-body">

            {/* Win probability bar */}
            {prob !== null && (
              <div>
                <div style={{
                  display: "flex", justifyContent: "space-between", marginBottom: 4,
                  fontFamily: "var(--ff-mono)", fontSize: 9, letterSpacing: "0.10em",
                  color: "rgba(255,255,255,0.6)",
                }}>
                  <span>WIN PROBABILITY</span>
                  <span style={{ color: "var(--green)", fontWeight: 700 }}>MODEL LIVE</span>
                </div>
                <div className="overlay-winrate-bar">
                  <div className="overlay-winrate-blue" style={{ width: `${prob}%` }}>{prob}%</div>
                  <div className="overlay-winrate-red">{100 - prob}%</div>
                </div>
                <div style={{
                  marginTop: 4, fontFamily: "var(--ff-mono)", fontSize: 9,
                  color: goldLead >= 0 ? "rgba(130,255,180,0.7)" : "rgba(255,100,100,0.7)",
                }}>
                  {deltaLabel}
                </div>
              </div>
            )}

            {/* AI tip */}
            <div className="overlay-tip">
              <div className="overlay-tip-icon">!</div>
              <div className="overlay-tip-text">
                <strong>Model input active</strong> — ONNX running locally. See Macro tab for full analysis.
              </div>
            </div>

            {/* Objectives */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div className="overlay-objective-row">
                <div className="overlay-obj-icon" style={{ background: "oklch(0.45 0.18 25)", color: "white" }}>DR</div>
                <span className="overlay-obj-name">Dragon</span>
                <span className={`overlay-obj-time${myHasSoul ? " ready" : ""}`}>{dragonLabel}</span>
              </div>
              <div className="overlay-objective-row">
                <div className="overlay-obj-icon" style={{ background: "oklch(0.45 0.14 75)", color: "white" }}>BN</div>
                <span className="overlay-obj-name">Baron Nashor</span>
                <span
                  className={`overlay-obj-time${myBaronActive ? " ready" : ""}`}
                  style={{ color: enemyBaronActive ? "var(--red)" : undefined }}
                >
                  {baronLabel}
                </span>
              </div>
              <div className="overlay-objective-row">
                <div className="overlay-obj-icon" style={{ background: "oklch(0.50 0.20 295)", color: "white" }}>EL</div>
                <span className="overlay-obj-name">Elder Dragon</span>
                <span
                  className={`overlay-obj-time${myElderActive ? " ready" : ""}`}
                  style={{ color: enemyElderActive ? "var(--red)" : undefined }}
                >
                  {elderLabel}
                </span>
              </div>
            </div>

            {/* Champion icons (DDragon) */}
            {(allies.length > 0 || enemies.length > 0) && (
              <ChampionGrid allies={allies} enemies={enemies} ddragon={ddragon} />
            )}

          </div>

          {/* ── Footer ──────────────────────────────────────────────── */}
          <div className="overlay-footer">
            <button className="overlay-footer-btn" style={{ pointerEvents: "auto" }}>BUILD</button>
            <button className="overlay-footer-btn" style={{ pointerEvents: "auto" }}>MAP</button>
            <button className="overlay-footer-btn" style={{
              background: "var(--accent-soft)", color: "var(--accent)", borderColor: "var(--accent)",
              pointerEvents: "auto",
            }}>OPEN</button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Champion icon grid ────────────────────────────────────────────────────────

interface GridProps {
  allies: PlayerSummary[];
  enemies: PlayerSummary[];
  ddragon: DDragonCtx | null;
}

function ChampionGrid({ allies, enemies, ddragon }: GridProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <TeamRow label="ALLY" players={allies} isAlly ddragon={ddragon} />
      <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />
      <TeamRow label="ENMY" players={enemies} isAlly={false} ddragon={ddragon} />
    </div>
  );
}

function TeamRow({ label, players, isAlly, ddragon }: {
  label: string;
  players: PlayerSummary[];
  isAlly: boolean;
  ddragon: DDragonCtx | null;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{
        fontFamily: "var(--ff-mono)", fontSize: 8, fontWeight: 700,
        letterSpacing: "0.10em", color: isAlly ? "var(--cyan)" : "var(--red)",
        width: 28, flexShrink: 0,
      }}>
        {label}
      </span>
      <div style={{ display: "flex", gap: 3 }}>
        {players.map(p => <ChampIcon key={p.summonerName} player={p} ddragon={ddragon} />)}
      </div>
    </div>
  );
}

function ChampIcon({ player, ddragon }: { player: PlayerSummary; ddragon: DDragonCtx | null }) {
  const champId = ddragon ? resolveChampId(player.championName, ddragon.champByName) : null;
  const iconUrl = champId && ddragon ? champIconUrl(ddragon.version, champId) : null;

  return (
    <div style={{
      width: 24, height: 24, borderRadius: 4, overflow: "hidden", flexShrink: 0,
      border: `1px solid ${player.isDead ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.22)"}`,
      opacity: player.isDead ? 0.4 : 1,
      filter: player.isDead ? "grayscale(0.9)" : undefined,
      position: "relative",
    }}>
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={player.championName}
          title={player.championName}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div style={{
          width: "100%", height: "100%", background: "var(--bg-4)",
          display: "grid", placeItems: "center",
          fontFamily: "var(--ff-mono)", fontSize: 7, color: "var(--fg-2)",
        }}>
          {player.championName.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );
}
